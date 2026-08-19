import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(import.meta.dirname, "..");
const readSource = (relativePath: string) => fs.readFileSync(path.join(projectRoot, relativePath), "utf8");

describe("high-star design research contract", () => {
  it("keeps the GitHub research record and its explicit non-copying boundary", () => {
    const research = readSource("DESIGN_RESEARCH_HIGH_STAR.md");
    expect(research).toContain("TryGhost/Ghost");
    expect(research).toContain("ueberdosis/tiptap");
    expect(research).toContain("hexojs/hexo");
    expect(research).toContain("adityatelange/hugo-PaperMod");
    expect(research).toContain("不复刻任何项目的视觉成品");
  });

  it("keeps the public reading path content-first and URL-restorable", () => {
    const home = readSource("client/src/pages/Home.tsx");
    const posts = readSource("client/src/pages/PostsList.tsx");
    const detail = readSource("client/src/pages/PostDetail.tsx");
    expect(home).toContain("此刻一言");
    expect(home).toContain("换一句");
    expect(home).toContain("全部文章");
    expect(posts).toContain("buildPostIndexLocation");
    expect(detail).toContain("仅你可见 · 待审核");
  });

  it("keeps writing status truthful and mobile settings distinct from desktop", () => {
    const createPost = readSource("client/src/pages/CreatePost.tsx");
    const editor = readSource("client/src/components/HaloPostEditor.tsx");
    expect(createPost).toContain("有未保存的修改");
    expect(createPost).toContain("草稿已保存");
    expect(editor).toContain('"aria-label": "文章正文"');
    expect(editor).toContain("halo-editor-sidebar");
  });

  it("keeps the requested 05b1a7c in-app player surface independent from router plugins", () => {
    const layout = readSource("client/src/components/BlogLayout.tsx");
    const compact = readSource("client/src/components/CompactMusicPlayer.tsx");
    const full = readSource("client/src/components/FullMusicPlayer.tsx");
    expect(layout).toContain("useState<1 | 2 | 3>(1)");
    expect(compact).toContain("compact-music-player--idle");
    expect(full).toContain("第 {trackIndex + 1} / {playlist.length} 首");
    expect(layout).not.toContain("pjaxMode");
  });
});
