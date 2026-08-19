export type LyricLine = { time: number; text: string };

export type LyricPair = { current: string; next: string };

const timestampPattern = /\[(\d+):(\d+(?:\.\d+)?)\]/g;

export function parseLrc(source: string): LyricLine[] {
  const lines: LyricLine[] = [];
  for (const sourceLine of source.split(/\r?\n/)) {
    const text = sourceLine.replace(timestampPattern, "").trim();
    timestampPattern.lastIndex = 0;
    if (!text) continue;
    const timestamps = Array.from(sourceLine.matchAll(timestampPattern));
    for (const match of timestamps) {
      const minutes = Number(match[1]);
      const seconds = Number(match[2]);
      if (Number.isFinite(minutes) && Number.isFinite(seconds)) lines.push({ time: minutes * 60 + seconds, text });
    }
  }
  return lines.sort((a, b) => a.time - b.time);
}

export function getLyricPairAtTime(lines: LyricLine[], time: number): LyricPair {
  if (!lines.length) return { current: "歌词正在加载…", next: "" };
  let currentIndex = 0;
  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index].time > time) break;
    currentIndex = index;
  }
  return { current: lines[currentIndex]?.text || "", next: lines[currentIndex + 1]?.text || "" };
}

export function getLyricAtTime(lines: LyricLine[], time: number): string {
  return getLyricPairAtTime(lines, time).current;
}
