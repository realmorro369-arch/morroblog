import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("initial administrator configuration", () => {
  it("uses an explicit valid recipient email that is distinct from the SMTP sender", () => {
    const initialAdminEmail = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
    const smtpSender = process.env.SMTP_USER?.trim().toLowerCase();

    expect(initialAdminEmail).toMatch(/^\S+@\S+\.\S+$/);
    expect(initialAdminEmail).not.toBe(smtpSender);
  });

  it("only promotes a configured, verified local account during server startup", () => {
    const dbSource = fs.readFileSync(path.resolve(import.meta.dirname, "db.ts"), "utf8");
    const serverSource = fs.readFileSync(path.resolve(import.meta.dirname, "_core/index.ts"), "utf8");

    expect(dbSource).toContain('eq(users.loginMethod, "email-password")');
    expect(dbSource).toContain("isNotNull(users.emailVerifiedAt)");
    expect(serverSource).toContain("promoteConfiguredInitialAdmin(process.env.INITIAL_ADMIN_EMAIL)");
  });
});
