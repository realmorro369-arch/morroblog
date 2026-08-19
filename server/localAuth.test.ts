import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  getUserByEmail: vi.fn(),
  getUserById: vi.fn(),
  getLatestEmailVerification: vi.fn(),
  countRecentEmailVerifications: vi.fn(),
  createEmailVerification: vi.fn(),
  incrementEmailVerificationAttempts: vi.fn(),
  markEmailVerificationUsed: vi.fn(),
  createLocalUser: vi.fn(),
  touchUserLastSignedIn: vi.fn(),
  updatePasswordAndBumpSessionVersion: vi.fn(),
  getDb: vi.fn(),
}));

const mailMocks = vi.hoisted(() => ({ sendMail: vi.fn(), createTransport: vi.fn() }));

vi.mock("./db", () => dbMocks);
vi.mock("nodemailer", () => ({
  default: { createTransport: mailMocks.createTransport },
}));

import { authenticateLocalRequest, issueLocalSession, LocalAuthError, loginWithEmail, registerWithEmail, requestPasswordResetCode, requestRegistrationCode, resetPasswordWithEmail } from "./localAuth";

const hash = (email: string, code: string) => createHash("sha256").update(`${email}:${code}:${process.env.JWT_SECRET ?? ""}`).digest("hex");
const sampleUser = {
  id: 41,
  openId: "local_test",
  email: "reader@example.com",
  passwordHash: null,
  emailVerifiedAt: new Date(),
  sessionVersion: 0,
  name: "Reader",
  loginMethod: "email-password",
  role: "user" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

describe("site-owned email authentication", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "test-local-auth-secret";
    process.env.SMTP_HOST = "smtp.test";
    process.env.SMTP_PORT = "465";
    process.env.SMTP_USER = "mailer@test.invalid";
    process.env.SMTP_PASS = "mail-password";
    process.env.SMTP_FROM = "MorroBlog <mailer@test.invalid>";
    vi.clearAllMocks();
    mailMocks.createTransport.mockReturnValue({ sendMail: mailMocks.sendMail });
    mailMocks.sendMail.mockResolvedValue({ messageId: "mock-message" });
    dbMocks.getUserByEmail.mockResolvedValue(undefined);
    dbMocks.getLatestEmailVerification.mockResolvedValue(undefined);
    dbMocks.countRecentEmailVerifications.mockResolvedValue(0);
  });

  it("sends a six-digit code while storing only its hash", async () => {
    await expect(requestRegistrationCode(" Reader@Example.com ")).resolves.toEqual({ sent: true, cooldownSeconds: 60 });

    const mail = mailMocks.sendMail.mock.calls[0]?.[0];
    const code = mail?.text.match(/(\d{6})/)?.[1];
    expect(mail?.to).toBe("reader@example.com");
    expect(mail?.subject).toBe("MorroBlog · 验证你的邮箱");
    expect(code).toMatch(/^\d{6}$/);
    expect(mail?.html).toContain("验证你的邮箱");
    expect(mail?.html).toContain(code);
    expect(mail?.html).toContain("10 分钟");
    expect(mail?.html).toContain("不要把验证码告诉任何人");
    expect(mail?.html).toContain("不会通过邮件、私信或客服渠道向你索取验证码或密码");
    expect(dbMocks.createEmailVerification).toHaveBeenCalledWith(expect.objectContaining({
      email: "reader@example.com",
      purpose: "register",
      codeHash: hash("reader@example.com", code!),
    }));
    expect(dbMocks.createEmailVerification.mock.calls[0]?.[0]?.codeHash).not.toBe(code);
  });

  it("rejects an incorrect registration code and records an attempt", async () => {
    dbMocks.getLatestEmailVerification.mockResolvedValue({
      id: 9,
      codeHash: hash("reader@example.com", "123456"),
      expiresAt: new Date(Date.now() + 60_000),
      attempts: 0,
    });

    await expect(registerWithEmail({ email: "reader@example.com", code: "654321", password: "safepassword1" }))
      .rejects.toBeInstanceOf(LocalAuthError);
    expect(dbMocks.incrementEmailVerificationAttempts).toHaveBeenCalledWith(9);
    expect(dbMocks.createLocalUser).not.toHaveBeenCalled();
  });

  it("creates a local user only after a valid code and stores a password hash", async () => {
    dbMocks.getLatestEmailVerification.mockResolvedValue({
      id: 9,
      codeHash: hash("reader@example.com", "123456"),
      expiresAt: new Date(Date.now() + 60_000),
      attempts: 0,
    });
    dbMocks.createLocalUser.mockResolvedValue(sampleUser);

    const result = await registerWithEmail({ email: "reader@example.com", code: "123456", password: "safepassword1", name: "Reader" });
    expect(await bcrypt.compare("safepassword1", dbMocks.createLocalUser.mock.calls[0]?.[0]?.passwordHash)).toBe(true);
    expect(dbMocks.markEmailVerificationUsed).toHaveBeenCalledWith(9);
    expect(dbMocks.getDb).not.toHaveBeenCalled();
    expect(result.user.role).toBe("user");
    expect(result.token).toEqual(expect.any(String));
  });

  it("never treats the SMTP sender address as an administrator identity", async () => {
    const senderEmail = "mailer@test.invalid";
    dbMocks.getLatestEmailVerification.mockResolvedValue({
      id: 10,
      codeHash: hash(senderEmail, "123456"),
      expiresAt: new Date(Date.now() + 60_000),
      attempts: 0,
    });
    dbMocks.createLocalUser.mockResolvedValue({ ...sampleUser, email: senderEmail, role: "user" });

    const result = await registerWithEmail({ email: senderEmail, code: "123456", password: "safepassword1" });
    expect(result.user.role).toBe("user");
    expect(dbMocks.getDb).not.toHaveBeenCalled();
  });

  it("assigns administrator role only to the separately configured initial admin recipient", async () => {
    process.env.INITIAL_ADMIN_EMAIL = "owner@example.com";
    dbMocks.getLatestEmailVerification.mockResolvedValue({
      id: 11,
      codeHash: hash("owner@example.com", "123456"),
      expiresAt: new Date(Date.now() + 60_000),
      attempts: 0,
    });
    dbMocks.createLocalUser.mockResolvedValue({ ...sampleUser, email: "owner@example.com", role: "admin" });

    const result = await registerWithEmail({ email: "owner@example.com", code: "123456", password: "safepassword1" });
    expect(dbMocks.createLocalUser).toHaveBeenCalledWith(expect.objectContaining({ email: "owner@example.com", role: "admin" }));
    expect(result.user.role).toBe("admin");
  });

  it("requires the correct password and resolves the signed local session to its user", async () => {
    const passwordHash = await bcrypt.hash("safepassword1", 10);
    dbMocks.getUserByEmail.mockResolvedValue({ ...sampleUser, passwordHash });
    dbMocks.getUserById.mockResolvedValue(sampleUser);

    const login = await loginWithEmail("reader@example.com", "safepassword1");
    expect(dbMocks.touchUserLastSignedIn).toHaveBeenCalledWith(sampleUser.id);
    await expect(authenticateLocalRequest({ headers: { cookie: `app_session_id=${login.token}` } } as any)).resolves.toEqual(sampleUser);
    await expect(loginWithEmail("reader@example.com", "wrong-password")).rejects.toBeInstanceOf(LocalAuthError);
  });

  it("issues tokens that cannot be mistaken for old third-party sessions", async () => {
    const token = await issueLocalSession(sampleUser);
    expect(token.split(".")).toHaveLength(3);
    await expect(authenticateLocalRequest({ headers: { cookie: "app_session_id=not-a-token" } } as any)).resolves.toBeNull();
  });

  it("does not disclose whether a password-reset email belongs to an account", async () => {
    await expect(requestPasswordResetCode("unknown@example.com")).resolves.toEqual({ sent: true, cooldownSeconds: 60 });
    expect(mailMocks.sendMail).not.toHaveBeenCalled();

    dbMocks.getUserByEmail.mockResolvedValue({ ...sampleUser, passwordHash: "stored-hash" });
    await expect(requestPasswordResetCode("reader@example.com")).resolves.toEqual({ sent: true, cooldownSeconds: 60 });
    const mail = mailMocks.sendMail.mock.calls[0]?.[0];
    expect(mail?.subject).toBe("MorroBlog · 重设你的密码");
    expect(dbMocks.createEmailVerification).toHaveBeenCalledWith(expect.objectContaining({ purpose: "reset_password" }));
  });

  it("resets a password only with a reset-purpose code and invalidates old local sessions", async () => {
    const oldToken = await issueLocalSession(sampleUser);
    dbMocks.getUserByEmail.mockResolvedValue({ ...sampleUser, passwordHash: "stored-hash" });
    dbMocks.getLatestEmailVerification.mockResolvedValue({
      id: 12,
      codeHash: hash("reader@example.com", "123456"),
      expiresAt: new Date(Date.now() + 60_000),
      attempts: 0,
    });
    dbMocks.updatePasswordAndBumpSessionVersion.mockResolvedValue({ ...sampleUser, passwordHash: "new-hash", sessionVersion: 1 });
    dbMocks.getUserById.mockResolvedValue({ ...sampleUser, sessionVersion: 1 });

    const result = await resetPasswordWithEmail({ email: "reader@example.com", code: "123456", password: "newsecurepassword" });
    expect(await bcrypt.compare("newsecurepassword", dbMocks.updatePasswordAndBumpSessionVersion.mock.calls[0]?.[1])).toBe(true);
    expect(dbMocks.markEmailVerificationUsed).toHaveBeenCalledWith(12);
    expect(result.user.sessionVersion).toBe(1);
    await expect(authenticateLocalRequest({ headers: { cookie: `app_session_id=${oldToken}` } } as any)).resolves.toBeNull();
  });
});
