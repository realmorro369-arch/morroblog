import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(import.meta.dirname, "..");
const readSource = (relativePath: string) => fs.readFileSync(path.join(projectRoot, relativePath), "utf8");

describe("visual readability and language contract", () => {
  it("keeps the dark theme readable with a night-blue base and warm high-contrast text", () => {
    const css = readSource("client/src/index.css");

    expect(css).toContain("--background: #27323c");
    expect(css).toContain("--foreground: #f5f0e7");
    expect(css).toContain("--muted-foreground: #c7cbd0");
    expect(css).toContain("--primary: #c9eff0");
    expect(css).toContain("--accent: #eab78c");
    expect(css).toContain("linear-gradient(162deg, #3b4a54");
  });

  it("uses editorial rules and restrained surfaces rather than stacked dark cards on key visitor pages", () => {
    const sources = [
      readSource("client/src/pages/Home.tsx"),
      readSource("client/src/pages/PostsList.tsx"),
      readSource("client/src/pages/PostDetail.tsx"),
      readSource("client/src/pages/AuthPage.tsx"),
      readSource("client/src/pages/Archives.tsx"),
      readSource("client/src/pages/TagsPage.tsx"),
      readSource("client/src/pages/GalleryPage.tsx"),
    ].join("\n");

    const publicCore = [
      readSource("client/src/pages/Home.tsx"),
      readSource("client/src/pages/PostsList.tsx"),
      readSource("client/src/pages/PostDetail.tsx"),
    ].join("\n");

    expect(publicCore).toContain("border-white/[0.28]");
    expect(publicCore).toContain("border-y border-white/[0.2]");
    expect(publicCore).not.toContain("bg-[#202630]");
    expect(sources).toContain("文章列表");
  });

  it("keeps the primary visitor copy concrete and natural in Chinese", () => {
    const home = readSource("client/src/pages/Home.tsx");
    const posts = readSource("client/src/pages/PostsList.tsx");
    const auth = readSource("client/src/pages/AuthPage.tsx");
    const editor = readSource("client/src/components/HaloPostEditor.tsx");
    const workspace = readSource("client/src/pages/PostWorkspace.tsx");
    const admin = readSource("client/src/pages/AdminDashboard.tsx");
    const archives = readSource("client/src/pages/Archives.tsx");
    const tags = readSource("client/src/pages/TagsPage.tsx");
    const gallery = readSource("client/src/pages/GalleryPage.tsx");
    const galleryDetail = readSource("client/src/pages/GalleryDetail.tsx");
    const notFound = readSource("client/src/pages/NotFound.tsx");
    const upload = readSource("client/src/components/ImageUpload.tsx");

    expect(home).toContain("此刻一言");
    expect(home).toContain("换一句");
    expect(home).toContain("PUBLIC QUOTE");
    expect(home).toContain("trpc.quote.current.useQuery");
    expect(home).toContain("formatHomeQuote");
    expect(home).not.toContain("这里收录代码、工具、硬件");
    expect(posts).toContain("想读的内容");
    expect(auth).toContain("用邮箱，");
    expect(auth).toContain("确认是你");
    expect(editor).toContain("暂无大纲");
    expect(editor).toContain("Markdown");
    expect(workspace).toContain("我的文章");
    expect(workspace).toContain("目前没有草稿。");
    expect(workspace).toContain("rounded-[1.6rem]");
    expect(workspace).not.toContain("AUTHOR WORKSPACE / PRIVATE INDEX");
    expect(workspace).not.toContain("DRAFT SHELF");
    expect(workspace).not.toContain("PUBLISHED INDEX");
    expect(admin).toContain("仪表盘");
    expect(admin).toContain("正在验证管理员权限…");
    expect(admin).toContain("暂时没有文章记录");
    expect(admin).toContain("站点设置");
    expect(admin).not.toContain("刷新概览");
    expect(admin).not.toContain("ADMIN CONSOLE / OWNER CLEARANCE");
    expect(admin).not.toContain("RESTRICTED CONSOLE");
    expect(archives).toContain("文章归档");
    expect(archives).toContain("正在整理归档…");
    expect(archives).not.toContain("CHRONOLOGICAL ARCHIVE");
    expect(tags).toContain("主题索引");
    expect(tags).toContain("让主题成为");
    expect(tags).toContain("暂时没有可用标签");
    expect(tags).not.toContain("SUBJECT INDEX / KEYWORDS");
    expect(gallery).toContain("图片集");
    expect(gallery).toContain("暂时没有公开图片集");
    expect(galleryDetail).toContain("这个图片集暂时无法查看");
    expect(galleryDetail).not.toContain("CABINET NOT FOUND");
    expect(notFound).toContain("页面不存在");
    expect(notFound).toContain("返回首页");
    expect(notFound).not.toContain("Page Not Found");
    expect(upload).toContain("插入图片");
    expect(upload).toContain("已保存到站内存储");
    expect(upload).not.toContain("INSERT IMAGE");
    expect(upload).not.toContain("STORED ON S3");
    expect(`${home}\n${posts}\n${auth}`).not.toContain("ARCHIVE INDEX / VOL. 01");
    expect(`${home}\n${posts}\n${auth}`).not.toContain("PRIVATE ACCESS / ISSUE 01");
  });
});
