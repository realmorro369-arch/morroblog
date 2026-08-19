import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(import.meta.dirname, "..");
const readSource = (relativePath: string) => fs.readFileSync(path.join(projectRoot, relativePath), "utf8");

describe("public interaction contract", () => {
  it("removes reserved Live2D messaging and mounts the restored in-app music player", () => {
    const layout = readSource("client/src/components/BlogLayout.tsx");
    const compactPlayer = readSource("client/src/components/CompactMusicPlayer.tsx");
    const fullPlayer = readSource("client/src/components/FullMusicPlayer.tsx");
    expect(layout).not.toContain("LIVE2D BAY");
    expect(layout).not.toContain("尚未接入角色资源");
    expect(layout).toContain("<CompactMusicPlayer");
    expect(layout).toContain("<FullMusicPlayer");
    expect(compactPlayer).toContain("level: 1 | 2");
    expect(fullPlayer).toContain("onReturnToControls");
  });

  it("uses keyboard-reachable buttons for every public card that routes to a detail page", () => {
    const sources = [readSource("client/src/pages/Home.tsx"), readSource("client/src/pages/PostsList.tsx"), readSource("client/src/pages/Archives.tsx"), readSource("client/src/pages/GalleryPage.tsx")];
    expect(sources.join("\n")).toContain("aria-label={`阅读文章：${post.title}`}");
    expect(sources.join("\n")).toContain("aria-label={`打开图片集：${gallery.title}`}");
    expect(sources.join("\n")).not.toMatch(/<article[^>]+onClick=/);
  });

  it("honors the tag query used by detail and tag-index navigation through the shared URL state module", () => {
    const postsList = readSource("client/src/pages/PostsList.tsx");
    const postFilters = readSource("client/src/lib/postFilters.ts");
    expect(postsList).toContain("parsePostIndexFilters(queryString)");
    expect(postsList).toContain("buildPostIndexLocation");
    expect(postFilters).toContain('params.get("tag")?.trim() || null');
  });

  it("keeps draft recovery concrete without exposing an author shortcut in visitor-first navigation", () => {
    const createPost = readSource("client/src/pages/CreatePost.tsx");
    const workspace = readSource("client/src/pages/PostWorkspace.tsx");
    const layout = readSource("client/src/components/BlogLayout.tsx");
    expect(createPost).toContain('persist("draft")');
    expect(workspace).toContain("trpc.posts.myPosts.useQuery");
    expect(layout).not.toContain('go("/workspace")');
  });

  it("keeps the restored player independent from plugin PJAX and external adapter routes", () => {
    const layout = readSource("client/src/components/BlogLayout.tsx");
    const serverEntry = readSource("server/_core/index.ts");
    expect(layout).not.toContain("HaloNavidromePlayer");
    expect(layout).not.toContain("pjaxMode");
    expect(serverEntry).not.toContain("registerHaloPlayerRoutes");
    expect(layout).toContain("morroPlaylist");
  });
});
