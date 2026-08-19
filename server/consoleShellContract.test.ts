import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");
const source = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

describe("Halo 适配的统一管理中心契约", () => {
  it("保留 Halo BasicLayout 原始文件、GPL 许可证与固定归属说明", () => {
    const shell = source("client/src/components/DashboardLayout.tsx");
    const attribution = source("THIRD_PARTY_CONSOLE_ATTRIBUTION.md");
    const license = source("LICENSE");

    expect(fs.existsSync(path.join(root, "third_party/halo-console/src/layouts/BasicLayout.vue"))).toBe(true);
    expect(fs.existsSync(path.join(root, "third_party/halo-console/LICENSE"))).toBe(true);
    expect(shell).toContain("d6616cf7031f6113cfb5c317dc88abd9e674c44e");
    expect(attribution).toContain("BasicLayout.vue");
    expect(attribution).toContain("Dashboard.vue");
    expect(attribution).toContain("PostList.vue");
    expect(attribution).toContain("GPL");
    expect(license).toContain("GNU GENERAL PUBLIC LICENSE");
    expect(fs.existsSync(path.join(root, "third_party/halo-console/src/modules/dashboard/Dashboard.vue"))).toBe(true);
    expect(fs.existsSync(path.join(root, "third_party/halo-console/src/modules/contents/posts/PostList.vue"))).toBe(true);
  });

  it("将管理员后台从访客布局隔离，并提供侧栏、移动菜单与受控内容导航", () => {
    const app = source("client/src/App.tsx");
    const shell = source("client/src/components/DashboardLayout.tsx");
    const admin = source("client/src/pages/AdminDashboard.tsx");

    expect(app).toContain('location.startsWith("/admin") ? routedContent : <BlogLayout>{routedContent}</BlogLayout>');
    expect(app).toContain('path="/admin/content/new"');
    expect(app).toContain('path="/admin/content/:id/edit"');
    expect(shell).toContain("Halo Console's `src/layouts/BasicLayout.vue`");
    expect(shell).toContain("SidebarProvider");
    expect(shell).toContain("Drawer");
    expect(shell).toContain("MORROBLOG CONSOLE");
    expect(admin).toContain("<DashboardLayout activeSection={selectedTab}");
    expect(admin).toContain("/admin/content/${post.id}/edit");
    expect(admin).toContain("consoleMeta");
    expect(admin).toContain("最近内容");
    expect(admin).toContain("继续管理");
    expect(admin).toContain("已发布文章");
  });

  it("保留全屏编辑器的控制台返回、草稿继续编辑与管理员账号安全创建路径", () => {
    const editor = source("client/src/pages/CreatePost.tsx");
    const localAuth = source("server/localAuth.ts");
    const database = source("server/db.ts");

    expect(editor).toContain('useRoute("/admin/content/:id/edit")');
    expect(editor).toContain('useRoute("/admin/content/new")');
    expect(editor).toContain('navigate(isConsoleEditor ? "/admin" : "/workspace")');
    expect(editor).toContain('`/admin/content/${created.id}/edit`');
    expect(localAuth).toContain("bcrypt.hash(input.password, 12)");
    expect(database).toContain('role: input.role ?? "user"');
    expect(database).toContain("emailVerifiedAt: new Date()");
  });

  it("统一图片上传的 Base64 输入与二进制限制为 30MB", () => {
    const router = source("server/routers.ts");
    const gallery = source("client/src/pages/AdminDashboard.tsx");
    const imageUpload = source("client/src/components/ImageUpload.tsx");

    expect(router).toContain("max(42_000_000)");
    expect(router).toContain("30 * 1024 * 1024");
    expect(router).toContain("图片不得超过 30MB");
    expect(gallery).toContain("maxSize={30}");
    expect(imageUpload).toContain("maxSize = 30");
  });
});
