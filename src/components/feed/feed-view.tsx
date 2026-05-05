"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { RefreshCw, Wifi } from "lucide-react";
import { Drop } from "@/types";
import { DropCard } from "./drop-card";

type SortMode = "attention" | "latest";

export function FeedView() {
  const [sort, setSort] = useState<SortMode>("attention");
  const [drops, setDrops] = useState<Drop[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveConnected, setLiveConnected] = useState(false);
  const channelRef = useRef<unknown>(null);

  const fetchDrops = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/drops");
      if (res.ok) {
        const data = await res.json();
        setDrops(data ?? []);
      }
    } catch {
      // keep current state
    }
    setLoading(false);
  }, []);

  // Realtime subscription — new drops pushed live
  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return;

    let active = true;

    import("@supabase/supabase-js").then(({ createClient }) => {
      if (!active) return;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const channel = supabase
        .channel("drops-feed")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "drops" },
          () => {
            // Refetch so we get the full drop with user + extractions joined
            fetchDrops();
          }
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "extractions" },
          (payload) => {
            // Update resolved state in-place without refetch
            setDrops((prev) =>
              prev.map((drop) => ({
                ...drop,
                extractions: drop.extractions?.map((ext) =>
                  ext.id === payload.new.id
                    ? { ...ext, resolved_at: payload.new.resolved_at, resolved_by: payload.new.resolved_by }
                    : ext
                ),
              }))
            );
          }
        )
        .subscribe((status) => {
          setLiveConnected(status === "SUBSCRIBED");
        });

      // @ts-ignore — dynamic import channel type
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

  useEffect(() => {
    fetchDrops();
  }, [fetchDrops]);

  const sorted = [...drops].sort((a, b) => {
    if (sort === "attention") {
      const aUnresolved =
        a.extractions?.filter(
          (e) =>
            (e.type === "blocker" || e.type === "ask") && !e.resolved_at
        ).length || 0;
      const bUnresolved =
        b.extractions?.filter(
          (e) =>
            (e.type === "blocker" || e.type === "ask") && !e.resolved_at
        ).length || 0;
      return bUnresolved - aUnresolved;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="pt-16 pb-20 px-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">Team Feed</h1>
          {liveConnected ? (
            <span className="flex items-center gap-1 text-mint text-xs">
              <Wifi size={11} />
              live
            </span>
          ) : (
            <button
              onClick={fetchDrops}
              className="text-cream-dim hover:text-cream transition-colors p-1"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          )}
        </div>
        <div className="flex bg-midnight-lighter rounded-lg p-0.5">
          <button
            onClick={() => setSort("attention")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              sort === "attention"
                ? "bg-coral text-white"
                : "text-cream-dim hover:text-cream"
            }`}
          >
            Needs Attention
          </button>
          <button
            onClick={() => setSort("latest")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              sort === "latest"
                ? "bg-coral text-white"
                : "text-cream-dim hover:text-cream"
            }`}
          >
            Latest
          </button>
        </div>
      </div>

      {loading && drops.length === 0 && (
        <div className="text-center py-20">
          <div className="text-4xl mb-3 animate-pulse">🎙️</div>
          <p className="text-sm text-cream-dim">Loading drops...</p>
        </div>
      )}

      {!loading && drops.length === 0 && (
        <div className="text-center py-20">
          <div className="text-4xl mb-3">🎙️</div>
          <h3 className="text-base font-medium mb-1">No drops yet.</h3>
          <p className="text-sm text-cream-dim">Be the morning hero.</p>
        </div>
      )}

      <div className="space-y-3">
        {sorted.map((drop, i) => (
          <DropCard key={drop.id} drop={drop} index={i} />
        ))}
      </div>
    </div>
  );
}
