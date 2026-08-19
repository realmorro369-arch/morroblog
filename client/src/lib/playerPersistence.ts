export const PLAYER_CONTEXT_STORAGE_KEY = "morroblog-player-context-v1";

export type PlayerPosition = { left: number; top: number };
export type PlaybackMode = "sequence" | "repeat-one" | "shuffle";

export type PersistedPlayerContext = {
  version: 1;
  trackIndex: number;
  currentTime: number;
  paused: boolean;
  volume: number;
  playbackMode: PlaybackMode;
  position: PlayerPosition | null;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function finiteNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function isPosition(value: unknown): value is PlayerPosition {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PlayerPosition>;
  return Number.isFinite(candidate.left) && Number.isFinite(candidate.top);
}

function isPlaybackMode(value: unknown): value is PlaybackMode {
  return value === "sequence" || value === "repeat-one" || value === "shuffle";
}

function resolveStorage(storage?: Storage | null) {
  if (storage !== undefined) return storage;
  return typeof window === "undefined" ? null : window.localStorage;
}

export function readPlayerContext(playlistLength: number, storage?: Storage | null): PersistedPlayerContext | null {
  const target = resolveStorage(storage);
  if (!target || playlistLength < 1) return null;

  try {
    const raw = target.getItem(PLAYER_CONTEXT_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const candidate = parsed as Partial<PersistedPlayerContext>;
    const trackIndex = Math.floor(finiteNumber(candidate.trackIndex, -1));
    if (trackIndex < 0 || trackIndex >= playlistLength) return null;

    return {
      version: 1,
      trackIndex,
      currentTime: Math.max(0, finiteNumber(candidate.currentTime, 0)),
      paused: typeof candidate.paused === "boolean" ? candidate.paused : true,
      volume: clamp(finiteNumber(candidate.volume, 1), 0, 1),
      playbackMode: isPlaybackMode(candidate.playbackMode) ? candidate.playbackMode : "sequence",
      position: isPosition(candidate.position) ? candidate.position : null,
    };
  } catch {
    return null;
  }
}

export function writePlayerContext(context: PersistedPlayerContext, storage?: Storage | null) {
  const target = resolveStorage(storage);
  if (!target) return false;

  try {
    target.setItem(PLAYER_CONTEXT_STORAGE_KEY, JSON.stringify(context));
    return true;
  } catch {
    return false;
  }
}
