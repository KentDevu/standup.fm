"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { mockDrops } from "@/lib/mock-data";
import { Drop } from "@/types";
import { DropCard } from "./drop-card";

type SortMode = "attention" | "latest";

export function FeedView() {
  const [sort, setSort] = useState<SortMode>("attention");
  const [drops, setDrops] = useState<Drop[]>(mockDrops);
  const [loading, setLoading] = useState(true);

  const fetchDrops = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/drops");
      if (res.ok) {
        const data = await res.json();
        if (data?.length) {
          setDrops(data);
        }
      }
    } catch {
      // keep mock data
    }
    setLoading(false);
  }, []);

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
          <button
            onClick={fetchDrops}
            className="text-cream-dim hover:text-cream transition-colors p-1"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
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

      {drops.length === 0 && !loading && (
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
