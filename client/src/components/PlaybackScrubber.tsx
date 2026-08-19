import { useEffect, useMemo, useState, type CSSProperties, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";

type PlaybackScrubberProps = {
  currentTime: number;
  duration: number;
  disabled?: boolean;
  formatClock: (value: number) => string;
  onSeek: (value: number) => void;
  density?: "compact" | "full";
  className?: string;
};

function clamp(value: number, max: number) {
  if (!Number.isFinite(value) || max <= 0) return 0;
  return Math.min(Math.max(0, value), max);
}

/**
 * 显式将“已播放”和“未播放”分成两个视觉层，并只在完成手势后提交 seek，
 * 以避免音频时间状态和拖动中的预览位置互相抖动。
 */
export function PlaybackScrubber({ currentTime, duration, disabled = false, formatClock, onSeek, density = "full", className = "" }: PlaybackScrubberProps) {
  const [previewValue, setPreviewValue] = useState<number | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
  const playedValue = clamp(currentTime, safeDuration);
  const displayValue = previewValue === null ? playedValue : clamp(previewValue, safeDuration);
  const percent = safeDuration > 0 ? Math.round((displayValue / safeDuration) * 1000) / 10 : 0;
  const label = useMemo(() => `${formatClock(displayValue)} / ${formatClock(safeDuration)}`, [displayValue, formatClock, safeDuration]);

  useEffect(() => {
    if (safeDuration === 0) {
      setPreviewValue(null);
      setIsScrubbing(false);
    }
  }, [safeDuration]);

  const stopParentDrag = (event: ReactPointerEvent<HTMLInputElement>) => event.stopPropagation();
  const updatePreview = (value: number) => {
    const next = clamp(value, safeDuration);
    setPreviewValue(next);
    if (!isScrubbing) onSeek(next);
  };
  const begin = (event: ReactPointerEvent<HTMLInputElement>) => {
    stopParentDrag(event);
    setIsScrubbing(true);
    setPreviewValue(clamp(Number(event.currentTarget.value), safeDuration));
  };
  const commit = (event: ReactPointerEvent<HTMLInputElement>) => {
    stopParentDrag(event);
    const next = clamp(Number(event.currentTarget.value), safeDuration);
    onSeek(next);
    setPreviewValue(null);
    setIsScrubbing(false);
  };
  const cancel = (event: ReactPointerEvent<HTMLInputElement>) => {
    stopParentDrag(event);
    setPreviewValue(null);
    setIsScrubbing(false);
  };
  const onKeyboard = (event: KeyboardEvent<HTMLInputElement>) => event.stopPropagation();
  const style = { "--playback-progress": `${percent}%` } as CSSProperties;

  return <div className={`playback-scrubber playback-scrubber--${density} ${isScrubbing ? "playback-scrubber--scrubbing" : ""} ${disabled || safeDuration <= 0 ? "playback-scrubber--disabled" : ""} ${className}`}>
    <div className="playback-scrubber__meta" aria-hidden="true"><span>{isScrubbing ? "准备跳转" : "已播放"}</span><span className="font-mono">{label}</span></div>
    <div className="playback-scrubber__track-wrap">
      <span className="playback-scrubber__track" style={style}><span className="playback-scrubber__signal" /></span>
      <input
        type="range"
        min="0"
        max={safeDuration}
        step="0.1"
        value={displayValue}
        disabled={disabled || safeDuration <= 0}
        onPointerDown={begin}
        onPointerUp={commit}
        onPointerCancel={cancel}
        onChange={(event) => updatePreview(Number(event.target.value))}
        onKeyDown={onKeyboard}
        className="playback-scrubber__input"
        aria-label="拖动播放进度"
        aria-valuetext={label}
      />
    </div>
  </div>;
}
