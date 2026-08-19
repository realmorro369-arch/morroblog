import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

describe("音乐播放列表与实时歌词契约", () => {
  it("继续使用用户授权的 morro.asia 曲目，并由恢复后的本地播放器直接读取队列和歌词", () => {
    const playlist = read("client/src/lib/musicPlaylist.ts");
    const layout = read("client/src/components/BlogLayout.tsx");
    const compactPlayer = read("client/src/components/CompactMusicPlayer.tsx");
    const fullPlayer = read("client/src/components/FullMusicPlayer.tsx");

    expect(playlist).toContain("https://morro.asia/music/");
    expect(playlist.match(/id: "/g)).toHaveLength(7);
    expect(layout).toContain("fetch(track.lyricsUrl");
    expect(layout).toContain("getAdjacentTrackIndex");
    expect(compactPlayer).toContain("可拖拽的紧凑音乐播放器");
    expect(fullPlayer).toContain("选择歌曲");
  });

  it("记录用户授权的音频来源与恢复后的站内播放器行为", () => {
    const attributions = read("ATTRIBUTIONS.md");

    expect(attributions).toContain("morro.asia/music/");
    expect(attributions).toContain("站点所有者已于 2026-08-15 确认");
    expect(attributions).toContain("LRC 时间轴");
    expect(attributions).toContain("三级悬浮播放器");
  });
});
