import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(import.meta.dirname, "..");
const homeSource = () => fs.readFileSync(path.join(projectRoot, "client/src/pages/Home.tsx"), "utf8");

describe("visitor-first home page", () => {
  it("places the full author profile before the relocated opening narrative and newest real article", () => {
    const home = homeSource();

    expect(home).toContain('splitHomePosts<any>(posts?.data ?? [])');
    expect(home).toContain('<AuthorIdentityCard className="min-h-[18rem] lg:h-full" />');
    expect(home).toContain("trpc.site.settings.useQuery");
    expect(home).toContain("siteSettings.home.openingTitle");
    expect(home).toContain("siteSettings.home.openingDescription");
    expect(home).not.toContain("siteBrand.author.introduction");
    expect(home).not.toContain("从这里继续");
    expect(home).toContain("max-w-5xl whitespace-pre-line");
    expect(home.indexOf("<AuthorIdentityCard className")).toBeLessThan(home.indexOf("siteSettings.home.openingTitle"));
    expect(home.indexOf("siteSettings.home.openingTitle")).toBeLessThan(home.indexOf("最新文章"));
    expect(home).toContain("刚写下");
    expect(home).toContain("latest.map");
    expect(home).toContain("post.excerpt ||");
  });

  it("keeps the author profile left of the quote at wide widths and preserves responsive reading paths", () => {
    const home = homeSource();

    expect(home).toContain("lg:grid-cols-[minmax(0,1.05fr)_minmax(18rem,0.95fr)]");
    expect(home.indexOf("<AuthorIdentityCard className")).toBeLessThan(home.indexOf('aria-label="此刻一言"'));
    expect(home).toContain("此刻一言");
    expect(home).toContain("PUBLIC QUOTE");
    expect(home).toContain("trpc.quote.current.useQuery");
    expect(home).toContain("sm:grid-cols-[auto_minmax(0,1fr)_170px]");
    expect(home).toContain('navigate("/timeline")');
  });
});
