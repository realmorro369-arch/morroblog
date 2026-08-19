import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useRef } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import type { MorroTrack } from "@/lib/musicPlaylist";

type CompactMusicPlayerProps = {
  level: 1 | 2;
  concealed?: boolean;
  transition?: "idle-to-controls" | "controls-to-idle" | "controls-to-full" | "full-to-controls" | null;
  externalDismissEnabled: boolean;
  onLevelChange: (level: 1 | 2) => void;
  track: MorroTrack;
  trackIndex: number;
  audioPlaying: boolean;
  audioUnavailable: boolean;
  currentTime: number;
  duration: number;
  progressLabel: string;
  positionClass: string;
  style?: CSSProperties;
  dragging: boolean;
  onOpenFull: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onToggle: () => void;
  onSeek: (value: number) => void;
  onDragStart: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onDragMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onDragEnd: (event: ReactPointerEvent<HTMLDivElement>) => void;
  consumeDragClick: () => boolean;
};

export function CompactMusicPlayer({ level, concealed = false, transition = null, externalDismissEnabled, onLevelChange, track, trackIndex, audioPlaying, audioUnavailable, currentTime, duration, progressLabel, positionClass, style, dragging, onOpenFull, onPrevious, onNext, onToggle, onSeek, onDragStart, onDragMove, onDragEnd, consumeDragClick }: CompactMusicPlayerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const controlsVisible = level === 2;
  const activate = () => onLevelChange(2);
  const stopDrag = (event: ReactPointerEvent<HTMLElement>) => event.stopPropagation();
  const activateFromTap = () => { if (!consumeDragClick()) activate(); };

  useEffect(() => {
    if (!controlsVisible || !externalDismissEnabled) return;
    const closeOnExternalPointer = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      onLevelChange(1);
    };
    document.addEventListener("pointerdown", closeOnExternalPointer, true);
    return () => document.removeEventListener("pointerdown", closeOnExternalPointer, true);
  }, [controlsVisible, externalDismissEnabled, onLevelChange]);

  return <div ref={rootRef} onPointerDown={(event) => { activate(); onDragStart(event); }} onPointerMove={onDragMove} onPointerUp={onDragEnd} onPointerCancel={onDragEnd} onPointerEnter={activate} onFocusCapture={activate} data-player-transition={transition ?? "settled"} className={`compact-music-player fixed z-[60] flex touch-none select-none rounded-[1.15rem] border border-white/[0.26] bg-[#607682]/45 shadow-[0_12px_28px_rgb(17_27_34_/_25%)] backdrop-blur-2xl ${positionClass} ${controlsVisible ? "compact-music-player--active h-[8.35rem] w-[min(calc(100vw-1.5rem),22rem)] flex-col gap-1.5 p-2" : "compact-music-player--idle h-11 w-fit max-w-[calc(100vw-1.5rem)] items-center gap-1 p-1 pr-2"} ${transition ? `compact-music-player--${transition}` : ""} ${concealed ? "compact-music-player--concealed pointer-events-none" : ""} ${dragging ? "cursor-grabbing" : "cursor-grab"}`} style={style} role="group" aria-label={`可拖拽的紧凑音乐播放器：${track.title}，${progressLabel}`}>
    {controlsVisible ? <>
      <div className="compact-music-player__identity flex w-full min-w-0 items-center gap-2">
        <button type="button" onPointerDown={stopDrag} onClick={onOpenFull} className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-[0.8rem] border border-white/[0.32]" aria-label={`进入 ${track.title} 的三级完整播放面板`}><img src={track.coverUrl} alt={`${track.title} 的原始内嵌封面`} className="h-full w-full object-cover" /></button>
        <button type="button" onPointerDown={stopDrag} onClick={onOpenFull} className="min-w-0 flex-1 text-left" aria-label="进入三级完整音乐播放器"><span className="block font-mono text-[8px] tracking-[0.12em] text-[#d0f4ee]/70">正在播放 · {String(trackIndex + 1).padStart(2, "0")}</span><span className="mt-0.5 block truncate text-[12px] font-medium text-[#fff8ed]">{track.title}</span><span className="block truncate text-[10px] text-[#d0cfca]">{track.artist}</span></button>
        <button type="button" onPointerDown={stopDrag} onClick={() => onLevelChange(1)} className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[#d0cfca] transition-colors hover:bg-white/[0.1] hover:text-[#d0f4ee]" aria-label="返回一级播放胶囊"><ChevronDown size={15} /></button>
      </div>
      <div onPointerDown={stopDrag} className="compact-music-player__timeline flex w-full min-w-0 items-center gap-2"><input type="range" min="0" max={duration || 0} step="0.1" value={Math.min(currentTime, duration || 0)} onChange={(event) => onSeek(Number(event.target.value))} className="h-1 min-w-0 flex-1 cursor-pointer accent-[#b9dbd7]" aria-label="在二级控制条拖动播放进度" disabled={audioUnavailable || duration <= 0} /><span className="shrink-0 font-mono text-[9px] text-[#d0cfca]/80">{progressLabel}</span></div>
      <div onPointerDown={stopDrag} className="compact-music-player__transport flex w-full items-center justify-between"><div className="flex items-center gap-1"><button type="button" onPointerDown={stopDrag} onClick={onPrevious} className="grid h-7 w-7 place-items-center rounded-full text-[#d0cfca] transition-colors hover:bg-white/[0.1] hover:text-[#d0f4ee]" aria-label="上一首"><ChevronLeft size={15} /></button><button type="button" onPointerDown={stopDrag} onClick={onToggle} className="grid h-8 w-8 place-items-center rounded-full bg-[#d0f4ee]/90 text-[#1d2b33] transition-transform active:scale-95" aria-label={audioPlaying ? "暂停音乐" : "播放音乐"} disabled={audioUnavailable}>{audioPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}</button><button type="button" onPointerDown={stopDrag} onClick={onNext} className="grid h-7 w-7 place-items-center rounded-full text-[#d0cfca] transition-colors hover:bg-white/[0.1] hover:text-[#d0f4ee]" aria-label="下一首"><ChevronRight size={15} /></button></div><button type="button" onPointerDown={stopDrag} onClick={onOpenFull} className="rounded-full border border-white/[0.2] px-2.5 py-1 font-mono text-[9px] tracking-[0.08em] text-[#d0f4ee] transition-colors hover:border-[#d0f4ee]/70 hover:bg-[#d0f4ee]/10" aria-label="进入三级完整音乐播放器">展开</button></div>
    </> : <button type="button" onClick={activateFromTap} className="flex max-w-[9.75rem] items-center gap-2 text-left" aria-label={`显示 ${track.title} 的播放控制`}><img src={track.coverUrl} alt={`${track.title} 的原始内嵌封面`} className="h-9 w-9 shrink-0 rounded-full border border-white/[0.3] object-cover" /><span className="truncate text-[11px] font-medium tracking-[0.035em] text-[#fff8ed]">{track.title}</span></button>}
  </div>;
}
