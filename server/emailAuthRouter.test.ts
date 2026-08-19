import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const localAuthMocks = vi.hoisted(() => ({
  loginWithEmail: vi.fn(),
  registerWithEmail: vi.fn(),
  requestRegistrationCode: vi.fn(),
  requestPasswordResetCode: vi.fn(),
  resetPasswordWithEmail: vi.fn(),
}));

vi.mock("./localAuth", async () => {
  const actual = await vi.importActual<typeof import("./localAuth")>("./localAuth");
  return { ...actual, ...localAuthMocks };
});

import { appRouter } from "./routers";

const user = {
  id: 7,
  openId: "local_router",
  email: "reader@example.com",
  passwordHash: "$2b$12$hidden-hash",
  emailVerifiedAt: new Date(),
  sessionVersion: 0,
  name: "Reader",
  loginMethod: "email-password",
  role: "user" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

function context(currentUser = user) {
  const cookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];
  return {
    cookies,
    ctx: {
      user: currentUser,
      req: { protocol: "https", headers: {} },
      res: {
        cookie: (name: string, value: string, options: Record<string, unknown>) => cookies.push({ name, value, options }),
        clearCookie: vi.fn(),
      },
    } as unknown as TrpcContext,
  };
}

describe("email auth router", () => {
  it("never returns the password hash from auth.me", async () => {
    const { ctx } = context();
    const result = await appRouter.createCaller(ctx).auth.me();
    expect(result).toMatchObject({ id: user.id, email: user.email });
    expect(result).not.toHaveProperty("passwordHash");
  });

  it("sets an httpOnly site session after a successful email login", async () => {
    localAuthMocks.loginWithEmail.mockResolvedValue({ user, token: "local-session-token" });
    const { ctx, cookies } = context(null as any);
    const result = await appRouter.createCaller(ctx).auth.login({ email: user.email, password: "safepassword1" });

    expect(result.user).not.toHaveProperty("passwordHash");
    expect(cookies[0]).toMatchObject({ name: "app_session_id", value: "local-session-token" });
    expect(cookies[0]?.options).toMatchObject({ httpOnly: true, path: "/", sameSite: "lax", secure: true });
  });

  it("delegates code requests without exposing SMTP configuration", async () => {
    localAuthMocks.requestRegistrationCode.mockResolvedValue({ sent: true, cooldownSeconds: 60 });
    const { ctx } = context(null as any);
    await expect(appRouter.createCaller(ctx).auth.requestRegistrationCode({ email: user.email })).resolves.toEqual({ sent: true, cooldownSeconds: 60 });
    expect(localAuthMocks.requestRegistrationCode).toHaveBeenCalledWith(user.email);
  });

  it("delegates a password-reset code request without revealing account metadata", async () => {
    localAuthMocks.requestPasswordResetCode.mockResolvedValue({ sent: true, cooldownSeconds: 60 });
    const { ctx } = context(null as any);
    await expect(appRouter.createCaller(ctx).auth.requestPasswordResetCode({ email: user.email })).resolves.toEqual({ sent: true, cooldownSeconds: 60 });
    expect(localAuthMocks.requestPasswordResetCode).toHaveBeenCalledWith(user.email);
  });

  it("sets a fresh site session after a verified password reset", async () => {
    localAuthMocks.resetPasswordWithEmail.mockResolvedValue({ user: { ...user, sessionVersion: 1 }, token: "new-local-session-token" });
    const { ctx, cookies } = context(null as any);
    const result = await appRouter.createCaller(ctx).auth.resetPassword({ email: user.email, code: "123456", password: "newsecurepassword" });

    expect(localAuthMocks.resetPasswordWithEmail).toHaveBeenCalledWith({ email: user.email, code: "123456", password: "newsecurepassword" });
    expect(result.user).not.toHaveProperty("passwordHash");
    expect(cookies[0]).toMatchObject({ name: "app_session_id", value: "new-local-session-token" });
  });
});
