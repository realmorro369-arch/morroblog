import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");
const source = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

describe("player progress experience contract", () => {
  it("uses a drag-preview scrubber that only commits the final seek position", () => {
    const scrubber = source("client/src/components/PlaybackScrubber.tsx");

    expect(scrubber).toContain("setPreviewValue");
    expect(scrubber).toContain("onPointerDown={begin}");
    expect(scrubber).toContain("onPointerUp={commit}");
    expect(scrubber).toContain("onSeek(next)");
    expect(scrubber).toContain("aria-valuetext={label}");
    expect(scrubber).toContain('"--playback-progress"');
    expect(scrubber).toContain("event.stopPropagation()");
  });

  it("keeps native seek controls visible in the restored compact and full player layers", () => {
    const compact = source("client/src/components/CompactMusicPlayer.tsx");
    const full = source("client/src/components/FullMusicPlayer.tsx");
    const css = source("client/src/index.css");

    expect(compact).toContain("compact-music-player--active h-[8.35rem]");
    expect(compact).toContain("进入三级完整音乐播放器");
    expect(compact).toContain('type="range"');
    expect(full).toContain('type="range"');
    expect(full).toContain("拖动播放进度");
    expect(css).toContain(".compact-music-player--active");
    expect(css).toContain(".full-music-player--visible");
  });

  it("keeps transport controls outside the draggable surface and preserves retry after browser play-policy rejection", () => {
    const compact = source("client/src/components/CompactMusicPlayer.tsx");
    const layout = source("client/src/components/BlogLayout.tsx");

    expect(compact).toContain("onPointerDown={stopDrag} onClick={onPrevious}");
    expect(compact).toContain("onPointerDown={stopDrag} onClick={onToggle}");
    expect(compact).toContain("onPointerDown={stopDrag} onClick={onNext}");
    expect(layout).toContain('toast.error("浏览器暂未允许播放，请再次点击播放按钮重试")');
    expect(layout).toContain("onPlay={() => setAudioPlaying(true)}");
    expect(layout).toContain("onPause={() => setAudioPlaying(false)}");
  });
});
