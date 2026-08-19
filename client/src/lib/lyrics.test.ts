import { describe, expect, it } from "vitest";
import { getLyricAtTime, parseLrc } from "./lyrics";
import { getAdjacentTrackIndex, morroPlaylist } from "./musicPlaylist";

describe("实时歌词时间轴", () => {
  it("解析多时间戳 LRC 行并按时间排序", () => {
    expect(parseLrc("[00:10.50][00:20.00]同一句\n[00:05.00]前一句")).toEqual([
      { time: 5, text: "前一句" },
      { time: 10.5, text: "同一句" },
      { time: 20, text: "同一句" },
    ]);
  });

  it("按播放时间返回当前歌词，并在没有歌词时给出加载提示", () => {
    const lines = parseLrc("[00:01.00]第一句\n[00:03.00]第二句");
    expect(getLyricAtTime(lines, 0)).toBe("第一句");
    expect(getLyricAtTime(lines, 3.2)).toBe("第二句");
    expect(getLyricAtTime([], 0)).toBe("歌词正在加载…");
  });

  it("在曲目首尾之间循环顺序切歌", () => {
    expect(morroPlaylist).toHaveLength(7);
    expect(getAdjacentTrackIndex(0, -1)).toBe(6);
    expect(getAdjacentTrackIndex(6, 1)).toBe(0);
  });
});
