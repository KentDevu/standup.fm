"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Mic } from "lucide-react";
import { Drop } from "@/types";
import { DropCard } from "./drop-card";

type FilterMode = "all" | "blocked" | "eng" | "design" | "data";

const FILTERS: { id: FilterMode; label: string }[] = [
  { id: "all", label: "All" },
  { id: "blocked", label: "Blocked" },
  { id: "design", label: "Design" },
  { id: "eng", label: "Eng" },
  { id: "data", label: "Data" },
];

export function FeedView() {
  const [filter, setFilter] = useState<FilterMode>("all");
  const [drops, setDrops] = useState<Drop[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveConnected, setLiveConnected] = useState(false);
  const channelRef = useRef<unknown>(null);

  const fetchDrops = useCallback(async () => {
    try {
      const res = await fetch("/api/drops");
      if (res.ok) {
        const data = await res.json();
        setDrops(data ?? []);
      }
    } catch {
      // keep current state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      const t = setTimeout(() => void fetchDrops(), 0);
      return () => clearTimeout(t);
    }

    let active = true;

    import("@supabase/supabase-js").then(({ createClient }) => {
      if (!active) return;
      const supabase = createClient(supabaseUrl, supabaseKey);

      void fetchDrops();

      const channel = supabase
        .channel("drops-feed")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "drops" },
          () => {
            void fetchDrops();
          },
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "extractions" },
          (payload) => {
            setDrops((prev) =>
              prev.map((drop) => ({
                ...drop,
                extractions: drop.extractions?.map((ext) =>
                  ext.id === payload.new.id
                    ? {
                        ...ext,
                        resolved_at: payload.new.resolved_at,
                        resolved_by: payload.new.resolved_by,
                      }
                    : ext,
                ),
              })),
            );
          },
        )
        .subscribe((status) => {
          setLiveConnected(status === "SUBSCRIBED");
        });

      channelRef.current = channel;

      return () => {
        active = false;
        supabase.removeChannel(channel);
      };
    });

    return () => {
      active = false;
    };
  }, [fetchDrops]);

  const filtered = drops.filter((d) => {
    if (filter === "all") return true;
    if (filter === "blocked") return d.extractions?.some((e) => (e.type === "blocker" || e.type === "ask") && !e.resolved_at);
    return d.user?.role?.toLowerCase() === filter;
  });

  const sorted = [...filtered].sort((a, b) => {
    const aUnresolved =
      a.extractions?.filter(
        (e) => (e.type === "blocker" || e.type === "ask") && !e.resolved_at,
      ).length || 0;
    const bUnresolved =
      b.extractions?.filter(
        (e) => (e.type === "blocker" || e.type === "ask") && !e.resolved_at,
      ).length || 0;
    if (aUnresolved !== bUnresolved) return bUnresolved - aUnresolved;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="max-w-5xl mx-auto w-full">
      <div className="flex items-end justify-between gap-4 flex-wrap px-1 pb-1">
        <div>
          <div className="inline-flex items-center gap-2 text-xs text-ink-3 uppercase tracking-[0.12em]">
            <span className="w-2 h-2 rounded-full bg-accent-a shadow-[0_0_12px_var(--color-accent-a)]" />
            Live · {drops.length} of 7 dropped today
          </div>
          <h2 className="text-[clamp(22px,2.6vw,34px)] font-semibold tracking-tight mt-1.5">
            Team Feed
          </h2>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-[7px] rounded-full text-xs font-medium border transition-all duration-200 ${
                filter === f.id
                  ? "bg-accent-a/[0.18] border-accent-a/50 text-ink"
                  : "border-line bg-glass-bg text-ink-2 hover:text-ink hover:border-line-2"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading && drops.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass rounded-[20px] p-[18px] flex flex-col gap-3.5 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/[0.06]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-28 rounded bg-white/[0.06]" />
                  <div className="h-2.5 w-16 rounded bg-white/[0.04]" />
                </div>
              </div>
              <div className="h-12 rounded-[14px] bg-white/[0.04]" />
              <div className="space-y-2">
                <div className="h-2.5 w-full rounded bg-white/[0.04]" />
                <div className="h-2.5 w-3/4 rounded bg-white/[0.04]" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && drops.length === 0 && (
        <div className="text-center py-24 mt-4">
          <div className="w-20 h-20 mx-auto mb-5 rounded-3xl glass flex items-center justify-center">
            <Mic size={32} className="text-ink-4" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No drops yet</h3>
          <p className="text-sm text-ink-3">Be the morning hero.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
        {sorted.map((drop, i) => (
          <DropCard key={drop.id} drop={drop} index={i} />
        ))}
      </div>
    </div>
  );
}
