"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { RefreshCw, Wifi, Mic } from "lucide-react";
import { motion } from "framer-motion";
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

  const sorted = [...drops].sort((a, b) => {
    if (sort === "attention") {
      const aUnresolved =
        a.extractions?.filter(
          (e) => (e.type === "blocker" || e.type === "ask") && !e.resolved_at,
        ).length || 0;
      const bUnresolved =
        b.extractions?.filter(
          (e) => (e.type === "blocker" || e.type === "ask") && !e.resolved_at,
        ).length || 0;
      return bUnresolved - aUnresolved;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="px-4 md:px-6 lg:px-8 py-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl md:text-2xl font-bold">Team Feed</h1>
          {liveConnected ? (
            <span className="flex items-center gap-1.5 text-gold text-xs font-semibold glass-subtle px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
              Live
            </span>
          ) : (
            <button
              onClick={fetchDrops}
              className="text-cream-dim hover:text-cream transition-colors p-1.5 rounded-lg hover:bg-white/[0.04]"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          )}
        </div>
        <div className="flex glass-subtle rounded-xl p-1">
          <button
            onClick={() => setSort("attention")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              sort === "attention"
                ? "bg-gradient-to-r from-orange to-rose text-white shadow-sm shadow-orange/20"
                : "text-cream-dim hover:text-cream"
            }`}
          >
            Needs Attention
          </button>
          <button
            onClick={() => setSort("latest")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              sort === "latest"
                ? "bg-gradient-to-r from-orange to-rose text-white shadow-sm shadow-orange/20"
                : "text-cream-dim hover:text-cream"
            }`}
          >
            Latest
          </button>
        </div>
      </div>

      {loading && drops.length === 0 && (
        <div className="text-center py-24">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-5xl mb-4 inline-block"
          >
            🎙️
          </motion.div>
          <p className="text-sm text-cream-dim">Loading drops...</p>
        </div>
      )}

      {!loading && drops.length === 0 && (
        <div className="text-center py-24">
          <div className="w-20 h-20 mx-auto mb-5 rounded-3xl glass-card flex items-center justify-center">
            <Mic size={32} className="text-cream-muted" />
          </div>
          <h3 className="text-lg font-bold mb-1">No drops yet</h3>
          <p className="text-sm text-cream-dim">Be the morning hero.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {sorted.map((drop, i) => (
          <DropCard key={drop.id} drop={drop} index={i} />
        ))}
      </div>
    </div>
  );
}
