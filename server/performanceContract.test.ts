import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");
const source = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

describe("runtime resource and production bundle contract", () => {
  it("keeps the restored local player bounded through lyric cancellation and progress throttling", () => {
    const layout = source("client/src/components/BlogLayout.tsx");
    expect(layout).toContain("const controller = new AbortController()");
    expect(layout).toContain("controller.abort()");
    expect(layout).toContain("lastProgressCommit");
    expect(layout).toContain("now - lastProgressCommit.current < 120");
    expect(layout).not.toContain("HaloNavidromePlayer");
  });

  it("keeps heavy rendering and shared runtime dependencies in explicit cache chunks", () => {
    const config = source("vite.config.ts");
    expect(config).toContain('"markdown-rendering"');
    expect(config).toContain('motion: ["framer-motion"]');
    expect(config).toContain('"data-client"');
    expect(config).toContain('"react-runtime"');
    expect(config).toContain("manualChunks");
  });

  it("defers invisible lyric and playlist work while keeping the existing player surface intact", () => {
    const layout = source("client/src/components/BlogLayout.tsx");
    const fullPlayer = source("client/src/components/FullMusicPlayer.tsx");

    expect(layout).toContain("if (playerLevel !== 3) return");
    expect(layout).toContain("lyricCache.current.get(track.id)");
    expect(layout).toContain("setPlaylistLoaded(true)");
    expect(fullPlayer).toContain("playlistLoaded && playlist.map");
    expect(fullPlayer).toContain('loading="lazy"');
    expect(fullPlayer).toContain('decoding="async"');
  });

  it("keeps public quote requests bounded and cached without changing their response shape", () => {
    const quote = source("server/hitokoto.ts");

    expect(quote).toContain("const HITOKOTO_TIMEOUT_MS = 1000");
    expect(quote).toContain("const HITOKOTO_CACHE_TTL_MS = 10 * 60 * 1000");
    expect(quote).toContain("cachedQuote");
    expect(quote).toContain("AbortSignal.timeout(HITOKOTO_TIMEOUT_MS)");
  });
});
