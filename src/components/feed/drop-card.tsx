"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, Clock } from "lucide-react";
import { Drop } from "@/types";
import { Avatar } from "@/components/ui/avatar";
import { TagChip } from "@/components/ui/tag-chip";
import { Waveform } from "@/components/ui/waveform";
import { formatDistanceToNow } from "date-fns";

export function DropCard({
  drop,
  index,
}: {
  drop: Drop;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(
    new Set(
      drop.extractions
        ?.filter((e) => e.resolved_at)
        .map((e) => e.id) || []
    )
  );

  const hasUnresolved = drop.extractions?.some(
    (e) =>
      (e.type === "blocker" || e.type === "ask") &&
      !resolvedIds.has(e.id)
  );

  const handleResolve = (extractionId: string) => {
    setResolvedIds((prev) => new Set([...prev, extractionId]));
  };

  const timeAgo = formatDistanceToNow(new Date(drop.created_at), {
    addSuffix: true,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`bg-midnight-light rounded-2xl border ${hasUnresolved ? "border-coral/20" : "border-white/5"} overflow-hidden`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Avatar name={drop.user?.name || "?"} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-cream text-sm">
                {drop.user?.name}
              </span>
              {hasUnresolved && (
                <span className="w-2 h-2 rounded-full bg-coral animate-pulse" />
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-cream-dim">
              <Clock size={10} />
              <span>{timeAgo}</span>
              <span>·</span>
              <span>{drop.user?.role}</span>
            </div>
          </div>
          {drop.sentiment_score !== null && (
            <div
              className="text-xs font-mono px-2 py-1 rounded-full"
              style={{
                backgroundColor:
                  drop.sentiment_score > 0.7
                    ? "rgba(78,205,196,0.15)"
                    : drop.sentiment_score > 0.4
                      ? "rgba(251,191,36,0.15)"
                      : "rgba(255,107,107,0.15)",
                color:
                  drop.sentiment_score > 0.7
                    ? "#4ECDC4"
                    : drop.sentiment_score > 0.4
                      ? "#FBBF24"
                      : "#FF6B6B",
              }}
            >
              {drop.sentiment_score > 0.7
                ? "😊"
                : drop.sentiment_score > 0.4
                  ? "😐"
                  : "😟"}{" "}
              {Math.round(drop.sentiment_score * 100)}%
            </div>
          )}
        </div>

        <div className="mt-3">
          <Waveform
            duration={drop.duration}
            isPlaying={playing}
            onToggle={() => setPlaying(!playing)}
          />
        </div>

        {drop.extractions && drop.extractions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {drop.extractions.map((ext) => (
              <TagChip
                key={ext.id}
                type={ext.type}
                content={ext.content}
                resolved={resolvedIds.has(ext.id)}
                onResolve={() => handleResolve(ext.id)}
              />
            ))}
          </div>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 mt-3 text-xs text-cream-dim hover:text-cream transition-colors"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expanded ? "Hide transcript" : "Show transcript"}
        </button>

        {expanded && drop.transcript && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-3 text-sm text-cream/70 leading-relaxed border-l-2 border-coral/30 pl-3"
          >
            {drop.transcript}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
