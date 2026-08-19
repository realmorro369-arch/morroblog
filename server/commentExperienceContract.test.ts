import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");
const source = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

describe("评论发表与审核体验契约", () => {
  it("限制评论长度，并继续验证回复必须属于同一篇文章", () => {
    const router = source("server/routers.ts");
    expect(router).toContain('max(2000, "评论不能超过 2000 个字符")');
    expect(router).toContain("回复的目标评论不存在或不属于这篇文章");
    expect(router).toContain("status: 'pending'");
  });

  it("管理员可按真实审核状态浏览、批准、拒绝和退回审核", () => {
    const db = source("server/db.ts");
    const router = source("server/routers.ts");
    const admin = source("client/src/pages/AdminDashboard.tsx");
    expect(db).toContain("getAdminComments");
    expect(router).toContain('z.enum(["all", "pending", "approved", "rejected"])');
    expect(router).toContain("setStatus: adminProcedure");
    expect(admin).toContain("reviewFilter");
    expect(admin).toContain("退回审核");
    expect(admin).toContain("重新审核");
  });

  it("访客评论表单提供字数、提交状态、回复定位与登录回退", () => {
    const detail = source("client/src/pages/PostDetail.tsx");
    expect(detail).toContain("COMMENT_MAX_LENGTH = 2000");
    expect(detail).toContain("replyInputRef.current?.focus()");
    expect(detail).toContain('role="status"');
    expect(detail).toContain('data-comment-status={comment.status}');
    expect(detail).toContain('navigate("/login")');
    expect(detail).toContain("仅你可见 · 待审核");
  });
});
