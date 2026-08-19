import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");
const source = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

describe("writing workspace and admin console upgrade contract", () => {
  it("keeps a recoverable, uninterrupted writing flow", () => {
    const editor = source("client/src/pages/CreatePost.tsx");

    expect(editor).toContain("beforeunload");
    expect(editor).toContain("saveWithShortcut");
    expect(editor).toContain("草稿已保存，仍可继续编辑");
    expect(editor).toContain("/admin/content/${created.id}/edit");
    expect(editor).toContain("约 {readingMinutes} 分钟");
    expect(editor).toContain("文稿 → 设置 →");
  });

  it("keeps the administrative console action-oriented without adding fabricated data", () => {
    const admin = source("client/src/pages/AdminDashboard.tsx");

    expect(admin).toContain("<RefreshCw");
    expect(admin).toContain("后台概览已刷新");
    expect(admin).toContain("navigate(`/admin/content/${post.id}/edit`)");
    expect(admin).toContain("查看当前站点的真实内容状态与待处理事项");
    expect(admin).toContain("站点设置");
    expect(admin).not.toContain("每一处操作只影响你明确选择的真实数据");
    expect(admin).not.toContain("示例文章");
  });
});
