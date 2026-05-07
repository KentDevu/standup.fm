"use client";

import { ExtractionType } from "@/types";
import { Check } from "lucide-react";

const tagConfig: Record<
  ExtractionType,
  { icon: string; bg: string; text: string; border: string }
> = {
  win: {
    icon: "✦",
    bg: "bg-accent-a/8",
    text: "text-accent-a",
    border: "border-accent-a/15",
  },
  blocker: {
    icon: "⚡",
    bg: "bg-[#FF6B6B]/8",
    text: "text-[#FF6B6B]",
    border: "border-[#FF6B6B]/15",
  },
  ask: {
    icon: "◉",
    bg: "bg-accent-c/8",
    text: "text-accent-c",
    border: "border-accent-c/15",
  },
  decision: {
    icon: "◆",
    bg: "bg-[#FFD166]/8",
    text: "text-[#FFD166]",
    border: "border-[#FFD166]/15",
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
          className="ml-1 px-2 py-0.5 bg-accent-a/12 text-accent-a rounded-md text-[10px] font-bold hover:bg-accent-a/20 transition-colors border border-accent-a/15"
        >
          I got this
        </button>
      )}
      {resolved && (
        <Check size={10} className="text-accent-a" />
      )}
    </div>
  );
}
