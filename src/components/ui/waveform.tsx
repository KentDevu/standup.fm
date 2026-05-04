"use client";

import { useState, useMemo } from "react";

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
  const bars = 40;
  const [hovered, setHovered] = useState(false);
  const heights = useMemo(() => seededHeights(bars, duration * 7 + 42), [duration]);

  return (
    <button
      onClick={onToggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center gap-1 h-10 w-full group cursor-pointer"
    >
      <div className="flex items-end gap-[2px] h-8 flex-1">
        {heights.map((height, i) => {
          return (
            <div
              key={i}
              className={`flex-1 rounded-full transition-all duration-150 ${
                isPlaying
                  ? "bg-coral waveform-bar"
                  : hovered
                    ? "bg-coral/60"
                    : "bg-cream/20"
              }`}
              style={{
                height: `${height}%`,
                animationDelay: `${i * 0.05}s`,
              }}
            />
          );
        })}
      </div>
      <span className="text-xs text-cream-dim font-mono ml-2 w-10 text-right">
        {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, "0")}
      </span>
    </button>
  );
}

export function LiveWaveform() {
  const bars = 50;
  const durations = useMemo(
    () => Array.from({ length: bars }, (_, i) => 0.4 + ((i * 9301 + 49297) % 233280) / 233280 * 0.6),
    []
  );

  return (
    <div className="flex items-end gap-[2px] h-16 w-full">
      {durations.map((dur, i) => (
        <div
          key={i}
          className="flex-1 bg-coral rounded-full waveform-bar"
          style={{
            animationDelay: `${i * 0.04}s`,
            animationDuration: `${dur}s`,
          }}
        />
      ))}
    </div>
  );
}
