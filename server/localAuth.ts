import { createHash, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import type { Request } from "express";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import nodemailer from "nodemailer";
import type { User } from "../drizzle/schema";
import * as db from "./db";

const SESSION_ISSUER = "morroblog.local";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_CODES_PER_HOUR = 5;
const MAX_CODE_ATTEMPTS = 5;
type VerificationPurpose = "register" | "reset_password";

export class LocalAuthError extends Error {
  constructor(public readonly code: "BAD_REQUEST" | "CONFLICT" | "TOO_MANY_REQUESTS" | "UNAUTHORIZED" | "INTERNAL_SERVER_ERROR", message: string) {
    super(message);
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isConfiguredInitialAdmin(email: string) {
  const configuredEmail = process.env.INITIAL_ADMIN_EMAIL;
  if (!configuredEmail) return false;
  return normalizeEmail(email) === normalizeEmail(configuredEmail);
}

function sessionKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new LocalAuthError("INTERNAL_SERVER_ERROR", "会话密钥未配置");
  return new TextEncoder().encode(secret);
}

function verificationHash(email: string, code: string) {
  return createHash("sha256").update(`${normalizeEmail(email)}:${code}:${process.env.JWT_SECRET ?? ""}`).digest("hex");
}

function parseCookie(header: string | undefined, name: string) {
  if (!header) return undefined;
  return header.split(";").map(part => part.trim()).find(part => part.startsWith(`${name}=`))?.slice(name.length + 1);
}

export async function issueLocalSession(user: User) {
  return new SignJWT({ uid: user.id, kind: "email-password", sv: user.sessionVersion })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(SESSION_ISSUER)
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(sessionKey());
}

export async function authenticateLocalRequest(req: Request): Promise<User | null> {
  const token = parseCookie(req.headers.cookie, "app_session_id");
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, sessionKey(), { algorithms: ["HS256"], issuer: SESSION_ISSUER });
    const id = Number(payload.uid);
    if (!Number.isSafeInteger(id) || id <= 0 || payload.kind !== "email-password") return null;
    const user = await db.getUserById(id);
    if (!user || payload.sv !== user.sessionVersion) return null;
    return user;
  } catch {
    return null;
  }
}

function transporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "465");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) throw new LocalAuthError("INTERNAL_SERVER_ERROR", "邮件服务未配置");
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

async function sendVerificationEmail(email: string, code: string, purpose: VerificationPurpose) {
  const isReset = purpose === "reset_password";
  const subject = isReset ? "MorroBlog · 重设你的密码" : "MorroBlog · 验证你的邮箱";
  const action = isReset ? "重设你的 MorroBlog 密码" : "为 MorroBlog 创建账号";
  const warning = isReset ? "如果这不是你本人发起的密码重设，请直接忽略本邮件；你的当前密码不会因此改变。" : "如果这不是你本人发起的注册，请直接忽略本邮件。";
  await transporter().sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    to: email,
    subject,
    text: `MorroBlog 账号验证\n\n你好：\n\n你正在${action}。请在页面输入以下验证码：\n\n${code}\n\n验证码将在 10 分钟后失效。\n\n为保护你的账号安全，请不要把验证码告诉任何人。MorroBlog 不会通过邮件、私信或客服渠道向你索取验证码或密码。\n\n${warning}`,
    html: `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;background:#eef1f3;color:#18242d;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif"><main style="max-width:600px;margin:0 auto;padding:48px 24px"><section style="background:#ffffff;padding:44px 40px;box-shadow:0 12px 32px rgba(19,36,48,.08)"><p style="margin:0 0 28px;color:#4a606b;font-size:12px;letter-spacing:.14em">MORROBLOG · 账号验证</p><h1 style="margin:0;color:#17232c;font-size:30px;line-height:1.25">${isReset ? "重设你的密码" : "验证你的邮箱"}</h1><p style="margin:28px 0 0;font-size:16px;line-height:1.8">你好，</p><p style="margin:8px 0 0;font-size:16px;line-height:1.8">你正在${action}。请在页面输入下面的验证码：</p><div style="margin:28px 0;padding:20px 24px;background:#eef4f4;border-left:3px solid #86bfc0;color:#17232c;font-size:32px;font-weight:700;letter-spacing:.22em;text-align:center">${code}</div><p style="margin:0;font-size:14px;line-height:1.8;color:#50626b">验证码将在 <strong style="color:#17232c">10 分钟</strong> 后失效。</p><hr style="border:0;border-top:1px solid #e4e8e9;margin:32px 0"><p style="margin:0;font-size:13px;line-height:1.8;color:#65757d">为保护你的账号安全，请不要把验证码告诉任何人。MorroBlog 不会通过邮件、私信或客服渠道向你索取验证码或密码。</p><p style="margin:20px 0 0;font-size:13px;line-height:1.8;color:#65757d">${warning}</p></section><p style="margin:20px 0 0;text-align:center;font-size:12px;color:#718189">MORROBLOG · 个人技术笔记</p></main></body></html>`,
  });
}

async function issueVerificationCode(email: string, purpose: VerificationPurpose) {
  const now = new Date();
  const latest = await db.getLatestEmailVerification(email, purpose);
  if (latest && now.getTime() - latest.createdAt.getTime() < RESEND_COOLDOWN_MS) {
    throw new LocalAuthError("TOO_MANY_REQUESTS", "验证码已发送，请 60 秒后再试");
  }
  if (await db.countRecentEmailVerifications(email, purpose, new Date(now.getTime() - 60 * 60 * 1000)) >= MAX_CODES_PER_HOUR) {
    throw new LocalAuthError("TOO_MANY_REQUESTS", "该邮箱请求过于频繁，请稍后再试");
  }
  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  await sendVerificationEmail(email, code, purpose);
  await db.createEmailVerification({ email, purpose, codeHash: verificationHash(email, code), expiresAt: new Date(now.getTime() + CODE_TTL_MS) });
  return { sent: true, cooldownSeconds: RESEND_COOLDOWN_MS / 1000 } as const;
}

async function consumeVerificationCode(email: string, code: string, purpose: VerificationPurpose) {
  if (!/^\d{6}$/.test(code)) throw new LocalAuthError("BAD_REQUEST", "验证码应为 6 位数字");
  const verification = await db.getLatestEmailVerification(email, purpose);
  if (!verification || verification.expiresAt.getTime() < Date.now()) throw new LocalAuthError("BAD_REQUEST", "验证码无效或已过期");
  if (verification.attempts >= MAX_CODE_ATTEMPTS) throw new LocalAuthError("TOO_MANY_REQUESTS", "验证码尝试次数过多，请重新获取");
  const expected = Buffer.from(verification.codeHash, "hex");
  const received = Buffer.from(verificationHash(email, code), "hex");
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    await db.incrementEmailVerificationAttempts(verification.id);
    throw new LocalAuthError("BAD_REQUEST", "验证码错误");
  }
  await db.markEmailVerificationUsed(verification.id);
}

export async function requestRegistrationCode(rawEmail: string) {
  const email = normalizeEmail(rawEmail);
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new LocalAuthError("BAD_REQUEST", "请输入有效的邮箱地址");
  if (await db.getUserByEmail(email)) throw new LocalAuthError("CONFLICT", "该邮箱已注册，请直接登录");

  return issueVerificationCode(email, "register");
}

export async function registerWithEmail(input: { email: string; code: string; password: string; name?: string }) {
  const email = normalizeEmail(input.email);
  if (input.password.length < 10 || input.password.length > 72) throw new LocalAuthError("BAD_REQUEST", "密码长度应为 10 至 72 个字符");
  if (await db.getUserByEmail(email)) throw new LocalAuthError("CONFLICT", "该邮箱已注册，请直接登录");
  await consumeVerificationCode(email, input.code, "register");
  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await db.createLocalUser({
    openId: `local_${randomUUID()}`,
    email,
    passwordHash,
    name: input.name?.trim() || null,
    role: isConfiguredInitialAdmin(email) ? "admin" : "user",
  });
  if (!user) throw new LocalAuthError("INTERNAL_SERVER_ERROR", "注册失败，请稍后再试");

  return { user, token: await issueLocalSession(user) };
}

export async function loginWithEmail(rawEmail: string, password: string) {
  const email = normalizeEmail(rawEmail);
  const user = await db.getUserByEmail(email);
  if (!user?.passwordHash || !user.emailVerifiedAt) throw new LocalAuthError("UNAUTHORIZED", "邮箱或密码错误");
  if (!(await bcrypt.compare(password, user.passwordHash))) throw new LocalAuthError("UNAUTHORIZED", "邮箱或密码错误");
  await db.touchUserLastSignedIn(user.id);
  return { user, token: await issueLocalSession(user) };
}

export async function requestPasswordResetCode(rawEmail: string) {
  const email = normalizeEmail(rawEmail);
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new LocalAuthError("BAD_REQUEST", "请输入有效的邮箱地址");
  const user = await db.getUserByEmail(email);
  if (user?.passwordHash && user.emailVerifiedAt) await issueVerificationCode(email, "reset_password");
  return { sent: true, cooldownSeconds: RESEND_COOLDOWN_MS / 1000 } as const;
}

export async function resetPasswordWithEmail(input: { email: string; code: string; password: string }) {
  const email = normalizeEmail(input.email);
  if (input.password.length < 10 || input.password.length > 72) throw new LocalAuthError("BAD_REQUEST", "密码长度应为 10 至 72 个字符");
  const user = await db.getUserByEmail(email);
  if (!user?.passwordHash || !user.emailVerifiedAt) throw new LocalAuthError("BAD_REQUEST", "验证码无效或已过期");
  await consumeVerificationCode(email, input.code, "reset_password");
  const updatedUser = await db.updatePasswordAndBumpSessionVersion(user.id, await bcrypt.hash(input.password, 12));
  if (!updatedUser) throw new LocalAuthError("INTERNAL_SERVER_ERROR", "密码重设失败，请稍后再试");
  return { user: updatedUser, token: await issueLocalSession(updatedUser) };
}
