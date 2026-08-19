import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(import.meta.dirname, "..");
const appSource = fs.readFileSync(path.join(projectRoot, "client/src/App.tsx"), "utf8");

describe("lazy route loading contract", () => {
  it("keeps the home page eager while loading non-home routes on demand", () => {
    expect(appSource).toContain('import Home from "./pages/Home"');
    expect(appSource).toContain('lazy(() => import("./pages/PostsList"))');
    expect(appSource).toContain('lazy(() => import("./pages/PostDetail"))');
    expect(appSource).toContain('lazy(() => import("./pages/CreatePost"))');
    expect(appSource).toContain('lazy(() => import("./pages/AdminDashboard"))');
    expect(appSource).not.toContain('import PostsList from "./pages/PostsList"');
    expect(appSource).not.toContain('import PostDetail from "./pages/PostDetail"');
  });

  it("shows a clear Chinese loading fallback while a page module is fetched", () => {
    expect(appSource).toContain("function PageLoading()");
    expect(appSource).toContain("正在打开页面…");
    expect(appSource).toContain("内容马上就好。");
    expect(appSource).toContain("<Suspense fallback={<PageLoading />}>");
  });
});
