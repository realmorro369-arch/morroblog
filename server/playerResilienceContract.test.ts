import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");
const source = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

describe("05b1a7c 本地播放器韧性契约", () => {
  it("持续挂载紧凑层和完整层，避免路由变化时注入外部脚本", () => {
    const layout = source("client/src/components/BlogLayout.tsx");
    expect(layout).toContain("<CompactMusicPlayer");
    expect(layout).toContain("<FullMusicPlayer");
    expect(layout).not.toContain("document.createElement(\"script\")");
    expect(layout).not.toContain("HaloNavidromePlayer");
  });

  it("在换曲或卸载时取消歌词请求，并只以节流频率提交进度状态", () => {
    const layout = source("client/src/components/BlogLayout.tsx");
    expect(layout).toContain("new AbortController()");
    expect(layout).toContain("controller.abort()");
    expect(layout).toContain("lastProgressCommit");
    expect(layout).toContain("< 120");
  });

  it("仅在超过拖拽阈值后安全捕获指针，避免普通控件点击被拖拽入口中断", () => {
    const layout = source("client/src/components/BlogLayout.tsx");
    expect(layout).toContain("setPointerCapture(event.pointerId)");
    expect(layout).toContain("Math.hypot(event.clientX - session.startX, event.clientY - session.startY) > 4");
    expect(layout).toContain("指针可能已被浏览器取消");
    expect(layout).toContain('closest("button, input, a, [data-player-control]")');
  });

  it("通过用户授权的播放列表直接管理队列，不依赖兼容路由或上游许可证资源", () => {
    const layout = source("client/src/components/BlogLayout.tsx");
    const playlist = source("client/src/lib/musicPlaylist.ts");
    expect(layout).toContain("morroPlaylist");
    expect(playlist).toContain("https://morro.asia/music/");
    expect(layout).not.toContain("/apis/ext.navidrome");
  });
});
