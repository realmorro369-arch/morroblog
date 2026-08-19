import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");
const source = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

describe("05b1a7c 本地播放器结构契约", () => {
  it("恢复一级胶囊、二级控制条和三级完整选曲面板", () => {
    const layout = source("client/src/components/BlogLayout.tsx");
    const compact = source("client/src/components/CompactMusicPlayer.tsx");
    const full = source("client/src/components/FullMusicPlayer.tsx");

    expect(layout).toContain("useState<1 | 2 | 3>(1)");
    expect(layout).toContain("<CompactMusicPlayer");
    expect(layout).toContain("<FullMusicPlayer");
    expect(compact).toContain("level: 1 | 2");
    expect(compact).toContain("compact-music-player--active");
    expect(compact).toContain("返回一级播放胶囊");
    expect(compact).toContain("进入三级完整音乐播放器");
    expect(full).toContain("返回二级播放控制");
    expect(full).toContain("选择歌曲");
  });

  it("只允许播放器在相邻层级之间切换，并为每个方向提供独立的过渡状态", () => {
    const layout = source("client/src/components/BlogLayout.tsx");
    const styles = source("client/src/index.css");

    expect(layout).toContain("Math.abs(nextLevel - currentLevel) !== 1");
    expect(layout).toContain('"1-2": "idle-to-controls"');
    expect(layout).toContain('"2-1": "controls-to-idle"');
    expect(layout).toContain('"2-3": "controls-to-full"');
    expect(layout).toContain('"3-2": "full-to-controls"');
    expect(styles).toContain("compact-music-player--idle-to-controls");
    expect(styles).toContain("compact-music-player--controls-to-full");
    expect(styles).toContain("full-music-player--full-to-controls");
  });

  it("直接从用户授权的 Morro 曲目读取音频与歌词，不保留 Halo 兼容路由", () => {
    const layout = source("client/src/components/BlogLayout.tsx");
    const serverEntry = source("server/_core/index.ts");

    expect(layout).toContain("morroPlaylist");
    expect(layout).toContain("fetch(track.lyricsUrl");
    expect(layout).toContain("getAdjacentTrackIndex");
    expect(layout).not.toContain("HaloNavidromePlayer");
    expect(serverEntry).not.toContain("registerHaloPlayerRoutes");
  });
});
