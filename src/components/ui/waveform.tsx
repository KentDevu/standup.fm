"use client";

import { useState, useMemo } from "react";
import { Play, Pause } from "lucide-react";

function seededHeights(count: number, seed: number) {
  const heights: number[] = [];
  let s = seed;
  for (let i = 0; i < count; i++) {
    s = (s * 9301 + 49297) % 233280;
    heights.push(20 + Math.sin(i * 0.5) * 30 + (s / 233280) * 50);
  }
  return heights;
}

export function Waveform({
  duration,
  isPlaying = false,
  onToggle,
  color,
}: {
  duration: number;
  isPlaying?: boolean;
  onToggle?: () => void;
  color?: string;
}) {
  const bars = 48;
  const [hovered, setHovered] = useState(false);
  const heights = useMemo(() => seededHeights(bars, duration * 7 + 42), [duration]);

  return (
    <button
      onClick={onToggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center gap-3 h-12 w-full group cursor-pointer rounded-[14px] px-3 py-2 bg-gradient-to-b from-white/[0.04] to-white/[0.01] hover:from-white/[0.06] hover:to-white/[0.02] transition-all duration-300 border border-line"
    >
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
          isPlaying
            ? "bg-gradient-to-br from-accent-a to-accent-b shadow-md shadow-accent-a/25"
            : "bg-white/[0.08] group-hover:bg-accent-a/20"
        }`}
      >
        {isPlaying ? (
          <Pause size={11} className="text-[#0a0a14]" />
        ) : (
          <Play size={11} className="text-ink ml-0.5" />
        )}
      </div>
      <div className="flex items-center gap-[2px] h-8 flex-1">
        {heights.map((height, i) => (
          <div
            key={i}
            className="flex-1 rounded-full transition-all duration-200"
            style={{
              height: `${height}%`,
              background: isPlaying
                ? (color || "var(--color-accent-a)")
                : hovered
                  ? "rgba(167, 139, 250, 0.4)"
                  : "rgba(244, 244, 255, 0.1)",
              animationDelay: isPlaying ? `${i * 0.04}s` : undefined,
            }}
          />
        ))}
      </div>
      <span className="text-[11px] text-ink-3 font-mono ml-1 w-10 text-right tabular-nums">
        {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, "0")}
      </span>
    </button>
  );
}

export function LiveWaveform() {
  const bars = 64;
  const durations = useMemo(
    () => Array.from({ length: bars }, (_, i) => 0.4 + ((i * 9301 + 49297) % 233280) / 233280 * 0.6),
    []
  );

  return (
    <div className="flex items-center gap-[3px] h-full w-full relative z-10">
      {durations.map((dur, i) => (
        <span
          key={i}
          className="flex-1 min-w-[2px] bg-gradient-to-b from-accent-a to-accent-c rounded-[2px] waveform-bar shadow-[0_0_8px_rgba(167,139,250,0.35)]"
          style={{
            animationDelay: `${i * 0.03}s`,
            animationDuration: `${dur}s`,
          }}
        />
      ))}
    </div>
  );
}
