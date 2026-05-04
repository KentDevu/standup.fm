"use client";

import { ExtractionType } from "@/types";

const tagConfig: Record<
  ExtractionType,
  { emoji: string; label: string; classes: string }
> = {
  win: {
    emoji: "🟢",
    label: "Win",
    classes: "bg-mint/15 text-mint border-mint/30",
  },
  blocker: {
    emoji: "🔴",
    label: "Blocker",
    classes: "bg-coral/15 text-coral border-coral/30",
  },
  ask: {
    emoji: "🟡",
    label: "Ask",
    classes: "bg-amber-400/15 text-amber-400 border-amber-400/30",
  },
  decision: {
    emoji: "🔵",
    label: "Decision",
    classes: "bg-blue-400/15 text-blue-400 border-blue-400/30",
  },
};

export function TagChip({
  type,
  content,
  resolved,
  onResolve,
}: {
  type: ExtractionType;
  content: string;
  resolved?: boolean;
  onResolve?: () => void;
}) {
  const config = tagConfig[type];

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${config.classes} ${resolved ? "opacity-50 line-through" : ""}`}
    >
      <span>{config.emoji}</span>
      <span className="max-w-[200px] truncate">{content}</span>
      {type === "blocker" && !resolved && onResolve && (
        <button
          onClick={onResolve}
          className="ml-1 px-2 py-0.5 bg-mint/20 text-mint rounded-full text-[10px] font-bold hover:bg-mint/30 transition-colors"
        >
          I got this
        </button>
      )}
      {resolved && (
        <span className="text-mint text-[10px] font-bold">Resolved</span>
      )}
    </div>
  );
}
