import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(import.meta.dirname, "..");
const source = (file: string) => fs.readFileSync(path.join(projectRoot, file), "utf8");

describe("authentication copy contract", () => {
  it("uses concrete, visitor-friendly registration copy and identifies the destination of a sent code", () => {
    const auth = source("client/src/pages/AuthPage.tsx");

    expect(auth).toContain("用邮箱，");
    expect(auth).toContain("确认是你");
    expect(auth).toContain("验证码已发送到 ${codeSentTo}");
    expect(auth).toContain("发送验证码");
    expect(auth).toContain("验证并创建账号");
    expect(auth).toContain("请不要把验证码或密码提供给任何人");
    expect(auth).not.toContain("登录后写一篇");
  });
});
