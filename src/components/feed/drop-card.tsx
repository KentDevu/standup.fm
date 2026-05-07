"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Heart, MessageCircle, Share2 } from "lucide-react";
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
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      className={`glass rounded-[20px] p-[18px] flex flex-col gap-3.5 ${hasUnresolved ? "!border-[#FF6B6B]/12" : ""}`}
    >
      {drop.audio_url && (
        <audio
          ref={audioRef}
          src={drop.audio_url}
          onEnded={() => setPlaying(false)}
          onError={() => setPlaying(false)}
          className="hidden"
        />
      )}

      <header className="flex items-center gap-3">
        <Avatar name={drop.user?.name || "?"} />
        <div className="flex flex-col flex-1 min-w-0">
          <div className="font-semibold text-sm text-ink">
            {drop.user?.name || "You"}{" "}
            {drop.user?.role && (
              <span className="text-ink-3 font-normal">· {drop.user.role}</span>
            )}
          </div>
          <div className="text-ink-3 text-xs">{timeAgo}</div>
        </div>
        {hasUnresolved && (
          <span className="text-[10px] tracking-[0.12em] uppercase px-2 py-1 rounded-full border border-[rgba(255,179,71,0.35)] text-[#FFB347] bg-[rgba(255,179,71,0.08)] whitespace-nowrap shrink-0">
            Blocked
          </span>
        )}
        {drop.sentiment_score !== null && (
          <span
            className={`text-xs font-mono px-2.5 py-1 rounded-full border whitespace-nowrap shrink-0 ${
              drop.sentiment_score > 0.7
                ? "text-accent-a border-accent-a/20 bg-accent-a/8"
                : drop.sentiment_score > 0.4
                  ? "text-[#FFD166] border-[#FFD166]/20 bg-[#FFD166]/8"
                  : "text-[#FF6B6B] border-[#FF6B6B]/20 bg-[#FF6B6B]/8"
            }`}
          >
            {drop.sentiment_score > 0.7
              ? "😊"
              : drop.sentiment_score > 0.4
                ? "😐"
                : "😟"}{" "}
            {Math.round(drop.sentiment_score * 100)}%
          </span>
        )}
      </header>

      <Waveform
        duration={drop.duration}
        isPlaying={playing}
        onToggle={togglePlay}
      />

      {drop.extractions && drop.extractions.length > 0 && (
        <div className="flex flex-wrap gap-2">
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
          <div className="flex flex-wrap gap-1.5">
            {names.map((name) => (
              <span
                key={name}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-accent-a/6 text-accent-a border border-accent-a/10"
              >
                @{name}
              </span>
            ))}
          </div>
        );
      })()}

      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-xs text-ink-4 hover:text-ink-3 transition-colors py-1"
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
            className="text-sm text-ink-3 leading-relaxed border-l-2 border-accent-a/15 pl-3"
          >
            {drop.transcript}
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="flex items-center justify-between gap-2.5 flex-wrap pt-2 border-t border-line">
        <div className="flex gap-1.5 flex-wrap">
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
                    ? "bg-accent-a/12 border border-accent-a/20 text-ink"
                    : "bg-glass-bg border border-line text-ink-3 hover:bg-glass-bg-2 hover:text-ink"
                }`}
              >
                <span>{emoji}</span>
                {count > 0 && <span className="font-mono text-[11px] tabular-nums">{count}</span>}
              </motion.button>
            );
          })}
        </div>
        <div className="flex gap-1">
          <button className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-ink-3 hover:text-ink hover:bg-glass-bg-2 text-xs transition-colors">
            <Heart size={14} />
          </button>
          <button className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-ink-3 hover:text-ink hover:bg-glass-bg-2 text-xs transition-colors">
            <MessageCircle size={14} />
          </button>
          <button className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-ink-3 hover:text-ink hover:bg-glass-bg-2 text-xs transition-colors">
            <Share2 size={14} />
          </button>
        </div>
      </footer>
    </motion.article>
  );
}
