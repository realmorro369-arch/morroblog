import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(import.meta.dirname, "..");
const readProjectFile = (relativePath: string) => fs.readFileSync(path.join(projectRoot, relativePath), "utf8");

describe("site settings domain contract", () => {
  it("persists a single, typed site settings record instead of distributing homepage identity across page constants", () => {
    const schema = readProjectFile("drizzle/schema.ts");
    expect(schema).toContain('mysqlTable("site_settings"');
    expect(schema).toContain('id: int("id").primaryKey().default(1)');
    expect(schema).toContain('featuredPostIds: text("featuredPostIds").notNull()');
    expect(schema).toContain('navigationOrder: text("navigationOrder").notNull()');
  });

  it("keeps saving settings behind adminProcedure and rejects non-published featured content", () => {
    const routes = readProjectFile("server/routers.ts");
    expect(routes).toContain("siteSettings: router({");
    expect(routes).toContain("save: adminProcedure");
    expect(routes).toContain('eq(posts.status, "published")');
    expect(routes).toContain("精选文章必须是已发布的真实文章");
  });

  it("has an explicit public read path and a local safe fallback for unavailable settings", () => {
    const home = readProjectFile("client/src/pages/Home.tsx");
    const adapter = readProjectFile("client/src/lib/siteSettings.ts");
    expect(home).toContain("trpc.site.settings.useQuery");
    expect(adapter).toContain("resolveSiteSettings");
    expect(adapter).toContain("if (!settings)");
  });
});
