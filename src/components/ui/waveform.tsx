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
}: {
  duration: number;
  isPlaying?: boolean;
  onToggle?: () => void;
}) {
  const bars = 48;
  const [hovered, setHovered] = useState(false);
  const heights = useMemo(() => seededHeights(bars, duration * 7 + 42), [duration]);

  return (
    <button
      onClick={onToggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center gap-2.5 h-12 w-full group cursor-pointer rounded-xl px-3 py-2 bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-300 border border-white/[0.03]"
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${isPlaying ? "bg-orange shadow-md shadow-orange/25" : "bg-white/[0.08] group-hover:bg-orange/20"}`}>
        {isPlaying ? (
          <Pause size={11} className="text-white" />
        ) : (
          <Play size={11} className="text-cream ml-0.5" />
        )}
      </div>
      <div className="flex items-end gap-[2px] h-8 flex-1">
        {heights.map((height, i) => (
          <div
            key={i}
            className={`flex-1 rounded-full transition-all duration-200 ${
              isPlaying
                ? "bg-orange waveform-bar"
                : hovered
                  ? "bg-orange/40"
                  : "bg-cream/10"
            }`}
            style={{
              height: `${height}%`,
              animationDelay: `${i * 0.04}s`,
            }}
          />
        ))}
      </div>
      <span className="text-[11px] text-cream-dim font-mono ml-1 w-10 text-right tabular-nums">
        {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, "0")}
      </span>
    </button>
  );
}

export function LiveWaveform() {
  const bars = 60;
  const durations = useMemo(
    () => Array.from({ length: bars }, (_, i) => 0.4 + ((i * 9301 + 49297) % 233280) / 233280 * 0.6),
    []
  );

  return (
    <div className="flex items-end gap-[2px] h-20 w-full px-2">
      {durations.map((dur, i) => (
        <div
          key={i}
          className="flex-1 bg-gradient-to-t from-orange to-gold rounded-full waveform-bar"
          style={{
            animationDelay: `${i * 0.03}s`,
            animationDuration: `${dur}s`,
          }}
        />
      ))}
    </div>
  );
}
