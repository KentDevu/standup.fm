"use client";

import { ExtractionType } from "@/types";
import { Check } from "lucide-react";

const tagConfig: Record<
  ExtractionType,
  { icon: string; bg: string; text: string; border: string }
> = {
  win: {
    icon: "✦",
    bg: "bg-gold/8",
    text: "text-gold",
    border: "border-gold/15",
  },
  blocker: {
    icon: "⚡",
    bg: "bg-rose/8",
    text: "text-rose",
    border: "border-rose/15",
  },
  ask: {
    icon: "◉",
    bg: "bg-orange/8",
    text: "text-orange",
    border: "border-orange/15",
  },
  decision: {
    icon: "◆",
    bg: "bg-amber-400/8",
    text: "text-amber-400",
    border: "border-amber-400/15",
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
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border backdrop-blur-sm transition-all duration-200 ${config.bg} ${config.text} ${config.border} ${resolved ? "opacity-35" : "hover:brightness-110"}`}
    >
      <span className="text-[10px]">{config.icon}</span>
      <span className={`max-w-[200px] truncate ${resolved ? "line-through" : ""}`}>{content}</span>
      {(type === "blocker" || type === "ask") && !resolved && onResolve && (
        <button
          onClick={onResolve}
          className="ml-1 px-2 py-0.5 bg-gold/12 text-gold rounded-md text-[10px] font-bold hover:bg-gold/20 transition-colors border border-gold/15"
        >
          I got this
        </button>
      )}
      {resolved && (
        <Check size={10} className="text-gold" />
      )}
    </div>
  );
}
