import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(import.meta.dirname, "..");
const source = (file: string) => fs.readFileSync(path.join(projectRoot, file), "utf8");

describe("gallery administration workflow", () => {
  it("organizes gallery management around a selected collection instead of an always-active upload control", () => {
    const admin = source("client/src/pages/AdminDashboard.tsx");

    expect(admin).toContain("图片集目录");
    expect(admin).toContain("先选择一个图片集");
    expect(admin).toContain("当前图片集");
    expect(admin).toContain("添加真实图片");
    expect(admin).toContain('label="上传图片到当前图片集（最大 30MB）"');
    expect(admin).toContain("maxSize={30}");
    expect(admin).toContain("过滤当前图片集");
    expect(admin).toContain("刷新图片集");
    expect(admin).toContain("这个图片集还没有图片");
    expect(admin).toContain("不会出现无效预览或示例素材");
  });

  it("keeps metadata edits and irreversible removals explicit", () => {
    const admin = source("client/src/pages/AdminDashboard.tsx");
    const router = source("server/routers.ts");

    expect(admin).toContain("保存图片集信息");
    expect(admin).toContain("危险操作");
    expect(admin).toContain("此操作不可恢复");
    expect(admin).toContain("确定从「${selectedGallery.title}」移除图片");
    expect(router).toContain("update: adminProcedure");
    expect(router).toContain("description: input.description?.trim() || null");
  });
});
