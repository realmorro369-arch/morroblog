import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createRobotsTxt, injectPageMetadata } from "./publicSite";

const root = path.resolve(import.meta.dirname, "..");
const source = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

describe("个人身份与公开发现契约", () => {
  it("将作者资料、真实当前状态和联系入口集中在可维护配置中", () => {
    const brand = source("client/src/lib/siteBrand.ts");
    const card = source("client/src/components/AuthorIdentityCard.tsx");

    expect(brand).toContain("现在在做什么");
    expect(brand).toContain("realmorro369-arch");
    expect(brand).toContain("realmorro369@gmail.com");
    expect(card).toContain("author.now.text");
    expect(card).toContain("author.contact.github.href");
    expect(card).toContain("author.contact.email.href");
  });

  it("在首页和文章末尾复用作者卡，并仅按真实标签关系读取继续阅读内容", () => {
    const home = source("client/src/pages/Home.tsx");
    const detail = source("client/src/pages/PostDetail.tsx");
    const router = source("server/routers.ts");
    const db = source("server/db.ts");

    expect(home).toContain('<AuthorIdentityCard className="min-h-[18rem] lg:h-full" />');
    expect(detail).toContain("trpc.posts.related.useQuery");
    expect(detail).toContain("<AuthorIdentityCard compact showStatus={false} />");
    expect(router).toContain("related: publicProcedure");
    expect(db).toContain("getRelatedPublishedPosts");
    expect(db).toContain('eq(posts.status, "published")');
  });

  it("提供可分享文章的复制与系统分享入口，以及机器可读的 RSS、sitemap、robots 和 OG 元信息", () => {
    const actions = source("client/src/components/ArticleShareActions.tsx");
    const entry = source("server/_core/index.ts");
    const html = source("client/index.html");
    const publicSite = source("server/publicSite.ts");

    expect(actions).toContain("navigator.share");
    expect(actions).toContain("navigator.clipboard.writeText");
    expect(entry).toContain('app.get("/rss.xml"');
    expect(entry).toContain('app.get("/sitemap.xml"');
    expect(entry).toContain('app.get("/robots.txt"');
    expect(html).toContain('href="/rss.xml"');
    expect(publicSite).toContain("PUBLIC_SITE_URL");
    expect(publicSite).toContain('property="og:title"');
    expect(publicSite).toContain("createSitemapXml");
    expect(createRobotsTxt("https://blog.example.test")).toContain("Sitemap: https://blog.example.test/sitemap.xml");
    expect(injectPageMetadata("<head><!-- site-meta --></head>", { title: "文章", description: "说明", canonicalUrl: "https://blog.example.test/posts/a", imageUrl: "https://blog.example.test/cover.jpg", type: "article" })).toContain('property="og:type" content="article"');
  });
});
