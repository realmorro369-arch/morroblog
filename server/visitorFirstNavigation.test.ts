import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(import.meta.dirname, "..");
const readSource = (relativePath: string) => fs.readFileSync(path.join(projectRoot, relativePath), "utf8");

describe("visitor-first navigation contract", () => {
  it("keeps the global navigation focused on public reading and reserves the role switch for admins", () => {
    const layout = readSource("client/src/components/BlogLayout.tsx");

    expect(layout).toContain('const isAdmin = isAuthenticated && user?.role === "admin"');
    expect(layout).toContain('go("/admin")');
    expect(layout).toContain("管理员视角");
    expect(layout).toContain("已登录");
    expect(layout).toContain("退出");
    expect(layout).not.toContain('go("/workspace")');
    expect(layout).not.toContain('go("/create")');
    expect(layout).not.toContain("写文章");
  });

  it("keeps the home hero visitor-led and leaves the privileged action in global navigation", () => {
    const home = readSource("client/src/pages/Home.tsx");

    expect(home).toContain('<AuthorIdentityCard className="min-h-[18rem] lg:h-full" />');
    expect(home).toContain("siteSettings.home.openingTitle");
    expect(home).toContain("trpc.site.settings.useQuery");
    expect(home).toContain("从最新记录开始");
    expect(home).toContain("沿时间阅读");
    expect(home).not.toContain("useAuth");
    expect(home).not.toContain('navigate("/admin")');
    expect(home).not.toContain('navigate("/create")');
    expect(home).not.toContain("登录后写一篇");
  });
});
