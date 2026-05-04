"use client";

import { useState } from "react";

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

  return (
    <button
      onClick={onToggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center gap-1 h-10 w-full group cursor-pointer"
    >
      <div className="flex items-end gap-[2px] h-8 flex-1">
        {Array.from({ length: bars }).map((_, i) => {
          const height = 20 + Math.sin(i * 0.5) * 30 + Math.random() * 50;
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

  return (
    <div className="flex items-end gap-[2px] h-16 w-full">
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className="flex-1 bg-coral rounded-full waveform-bar"
          style={{
            animationDelay: `${i * 0.04}s`,
            animationDuration: `${0.4 + Math.random() * 0.6}s`,
          }}
        />
      ))}
    </div>
  );
}
