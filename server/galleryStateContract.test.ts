import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(import.meta.dirname, "..");
const source = (file: string) => fs.readFileSync(path.join(projectRoot, file), "utf8");

describe("gallery empty and missing states", () => {
  it("gives visitors a truthful empty gallery state without fabricated image cards", () => {
    const galleryPage = source("client/src/pages/GalleryPage.tsx");

    expect(galleryPage).toContain("暂时没有公开图片集");
    expect(galleryPage).toContain("只展示管理员实际上传并公开的图片");
    expect(galleryPage).toContain("管理员创建图片集并上传图片后");
  });

  it("turns a missing gallery into an immediate, recoverable return state", () => {
    const detail = source("client/src/pages/GalleryDetail.tsx");

    expect(detail).toContain("retry: false");
    expect(detail).toContain("这个图片集暂时无法查看");
    expect(detail).toContain('navigate("/gallery")');
  });
});
