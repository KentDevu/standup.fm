"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Clock } from "lucide-react";
import { Drop, Reaction } from "@/types";
import { Avatar } from "@/components/ui/avatar";
import { TagChip } from "@/components/ui/tag-chip";
import { Waveform } from "@/components/ui/waveform";
import { formatDistanceToNow } from "date-fns";

const DEMO_USER_ID = "00000000-0000-0000-0000-000000000011";
const REACTION_EMOJIS = ["🔥", "💪", "🙌", "👀", "❤️"];

export function DropCard({ drop, index }: { drop: Drop; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(
    new Set(
      drop.extractions?.filter((e) => e.resolved_at).map((e) => e.id) || [],
    ),
  );
  const [reactions, setReactions] = useState<Reaction[]>(drop.reactions ?? []);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const hasUnresolved = drop.extractions?.some(
    (e) => (e.type === "blocker" || e.type === "ask") && !resolvedIds.has(e.id),
  );

  const handleResolve = async (extractionId: string) => {
    setResolvedIds((prev) => new Set([...prev, extractionId]));
    try {
      await fetch("/api/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extraction_id: extractionId }),
      });
    } catch {
      // already resolved in local state
    }
  };

  const handleReact = async (emoji: string) => {
    const isMine = reactions.some(
      (r) => r.emoji === emoji && r.user_id === DEMO_USER_ID,
    );
    if (isMine) {
      setReactions((prev) =>
        prev.filter((r) => !(r.emoji === emoji && r.user_id === DEMO_USER_ID)),
      );
    } else {
      setReactions((prev) => [
        ...prev,
        {
          id: `optimistic-${Date.now()}`,
          drop_id: drop.id,
          user_id: DEMO_USER_ID,
          emoji,
          created_at: new Date().toISOString(),
        },
      ]);
    }
    try {
      await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drop_id: drop.id, emoji }),
      });
    } catch {
      // optimistic state stays
    }
  };

  const togglePlay = useCallback(() => {
    if (audioRef.current) {
      if (playing) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => {});
      }
    }
    setPlaying(!playing);
  }, [playing]);

  const timeAgo = formatDistanceToNow(new Date(drop.created_at), {
    addSuffix: true,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      className={`glass-card rounded-2xl overflow-hidden ${hasUnresolved ? "!border-rose/12" : ""}`}
    >
      <div className="p-5">
        {drop.audio_url && (
          <audio
            ref={audioRef}
            src={drop.audio_url}
            onEnded={() => setPlaying(false)}
            onError={() => setPlaying(false)}
            className="hidden"
          />
        )}

        <div className="flex items-start gap-3 mb-4">
          <Avatar name={drop.user?.name || "?"} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-cream text-sm">
                {drop.user?.name || "You"}
              </span>
              {hasUnresolved && (
                <span className="w-2 h-2 rounded-full bg-rose animate-pulse shadow-sm shadow-rose/50" />
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-cream-dim mt-0.5">
              <Clock size={10} className="opacity-50" />
              <span>{timeAgo}</span>
              {drop.user?.role && (
                <>
                  <span className="opacity-20">·</span>
                  <span className="opacity-60">{drop.user.role}</span>
                </>
              )}
            </div>
          </div>
          {drop.sentiment_score !== null && (
            <div
              className={`text-xs font-mono px-2.5 py-1 rounded-lg glass-subtle border ${
                drop.sentiment_score > 0.7
                  ? "text-gold border-gold/12"
                  : drop.sentiment_score > 0.4
                    ? "text-orange border-orange/12"
                    : "text-rose border-rose/12"
              }`}
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

        <div className="mb-4">
          <Waveform
            duration={drop.duration}
            isPlaying={playing}
            onToggle={togglePlay}
          />
        </div>

        {drop.extractions && drop.extractions.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
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

        {(() => {
          const names = [
            ...new Set(
              drop.extractions?.flatMap((e) => e.mentions ?? []) ?? [],
            ),
          ].filter(Boolean);
          if (!names.length) return null;
          return (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {names.map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-medium bg-orange/6 text-orange border border-orange/10"
                >
                  @{name}
                </span>
              ))}
            </div>
          );
        })()}

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-xs text-cream-muted hover:text-cream-dim transition-colors py-1"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expanded ? "Hide transcript" : "Show transcript"}
        </button>

        <AnimatePresence>
          {expanded && drop.transcript && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 text-sm text-cream/50 leading-relaxed border-l-2 border-orange/15 pl-3"
            >
              {drop.transcript}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-3 pt-3 border-t border-white/[0.03] flex items-center gap-1.5 flex-wrap">
          {REACTION_EMOJIS.map((emoji) => {
            const count = reactions.filter((r) => r.emoji === emoji).length;
            const isMine = reactions.some(
              (r) => r.emoji === emoji && r.user_id === DEMO_USER_ID,
            );
            return (
              <motion.button
                key={emoji}
                whileTap={{ scale: 0.85 }}
                onClick={() => handleReact(emoji)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-all duration-200 ${
                  isMine
                    ? "bg-orange/12 border border-orange/20 text-cream"
                    : "bg-white/[0.02] border border-white/[0.04] text-cream-dim hover:bg-white/[0.05] hover:text-cream"
                }`}
              >
                <span>{emoji}</span>
                {count > 0 && <span className="font-mono text-[11px] tabular-nums">{count}</span>}
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
