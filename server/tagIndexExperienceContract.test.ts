import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

describe("标签主题索引体验契约", () => {
  it("基于真实标签和真实公开文章数量构建可恢复主题索引", () => {
    const tags = source("client/src/pages/TagsPage.tsx");
    expect(tags).toContain("trpc.tags.list.useQuery");
    expect(tags).toContain("publishedPostCount");
    expect(tags).toContain("encodeURIComponent(tag.slug)");
    expect(tags).toContain("${count} 篇已公开文章");
    expect(tags).toContain("尚无公开文章");
  });

  it("保留主题编号、桌面非对称索引和移动端可访问焦点，不依赖词云或伪造热度", () => {
    const tags = source("client/src/pages/TagsPage.tsx");
    expect(tags).toContain("T-{formatIndex(index)}");
    expect(tags).toContain("lg:col-span-7");
    expect(tags).toContain("focus-visible:ring-2");
    expect(tags).not.toContain("热门标签");
    expect(tags).not.toContain("趋势标签");
  });

  it("保留准确空状态和全部文章的回退路径", () => {
    const tags = source("client/src/pages/TagsPage.tsx");
    expect(tags).toContain("暂时没有可用标签");
    expect(tags).toContain("等真实文章添加标签后");
    expect(tags).toContain('href="/posts"');
  });
});
