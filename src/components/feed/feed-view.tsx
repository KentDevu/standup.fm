"use client";

import { useState } from "react";
import { mockDrops } from "@/lib/mock-data";
import { DropCard } from "./drop-card";

type SortMode = "attention" | "latest";

export function FeedView() {
  const [sort, setSort] = useState<SortMode>("attention");

  const sorted = [...mockDrops].sort((a, b) => {
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
        <h1 className="text-lg font-semibold">Team Feed</h1>
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

      <div className="space-y-3">
        {sorted.map((drop, i) => (
          <DropCard key={drop.id} drop={drop} index={i} />
        ))}
      </div>
    </div>
  );
}
