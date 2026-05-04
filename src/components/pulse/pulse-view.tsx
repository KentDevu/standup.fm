"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, TrendingUp } from "lucide-react";
import { Sparkline } from "@/components/ui/sparkline";
import { mockPulseMetrics, mockInsights } from "@/lib/mock-data";
import { PulseMetrics, AIInsight } from "@/types";

export function PulseView() {
  const [metrics, setMetrics] = useState<PulseMetrics>(mockPulseMetrics);
  const [insights, setInsights] = useState<AIInsight[]>(mockInsights);

  useEffect(() => {
    async function fetchPulse() {
      try {
        const res = await fetch("/api/pulse");
        if (res.ok) {
          const data = await res.json();
          if (data.metrics) setMetrics(data.metrics);
          if (data.insights?.length) setInsights(data.insights);
        }
      } catch {
        // keep mock data
      }
    }
    fetchPulse();
  }, []);

  const totalBlockers = metrics.blocker_frequency.reduce((a, b) => a + b, 0);
  const avgResolution =
    metrics.resolution_time.reduce((a, b) => a + b, 0) /
    metrics.resolution_time.length;
  const latestSentiment =
    metrics.sentiment_trend[metrics.sentiment_trend.length - 1];
  const firstSentiment = metrics.sentiment_trend[0];
  const sentimentDelta = Math.round((latestSentiment - firstSentiment) * 100);

  return (
    <div className="pt-16 pb-20 px-4 max-w-lg mx-auto">
      <div className="mb-4">
        <h1 className="text-lg font-semibold">Team Pulse</h1>
        <p className="text-xs text-cream-dim mt-1">
          A mirror for your team, not a manager dashboard.
        </p>
      </div>

      {insights.length > 0 && (
        <div className="space-y-2 mb-6">
          {insights.map((insight, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15 }}
              className={`rounded-xl p-3 border flex items-start gap-3 ${
                insight.severity === "warning"
                  ? "bg-amber-400/5 border-amber-400/20"
                  : insight.severity === "critical"
                    ? "bg-coral/5 border-coral/20"
                    : "bg-mint/5 border-mint/20"
              }`}
            >
              {insight.severity === "warning" ? (
                <AlertTriangle
                  size={16}
                  className="text-amber-400 shrink-0 mt-0.5"
                />
              ) : (
                <TrendingUp
                  size={16}
                  className="text-mint shrink-0 mt-0.5"
                />
              )}
              <p className="text-sm text-cream/80">{insight.message}</p>
            </motion.div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Sparkline
          data={metrics.blocker_frequency}
          color="coral"
          label="Blockers / Day"
          value={String(
            metrics.blocker_frequency[metrics.blocker_frequency.length - 1]
          )}
          unit="today"
        />
        <Sparkline
          data={metrics.resolution_time}
          color="amber"
          label="Resolution Time"
          value={
            metrics.resolution_time[
              metrics.resolution_time.length - 1
            ].toFixed(1)
          }
          unit="hrs avg"
        />
        <Sparkline
          data={metrics.participation}
          color="mint"
          label="Participation"
          value={String(
            metrics.participation[metrics.participation.length - 1]
          )}
          unit="% today"
        />
        <Sparkline
          data={metrics.sentiment_trend}
          color="blue"
          label="Sentiment"
          value={Math.round(
            metrics.sentiment_trend[metrics.sentiment_trend.length - 1] * 100
          ).toString()}
          unit="% positive"
        />
      </div>

      <div className="mt-6 bg-midnight-light rounded-xl p-4 border border-white/5">
        <h3 className="text-sm font-medium mb-3">This Week Summary</h3>
        <div className="space-y-2 text-sm text-cream/70">
          <p>
            <span className="text-coral font-medium">
              {totalBlockers} blockers
            </span>{" "}
            raised
          </p>
          <p>
            Average resolution time:{" "}
            <span className="font-mono text-cream">
              {avgResolution.toFixed(1)} hrs
            </span>
          </p>
          <p>
            Team mood trending{" "}
            <span
              className={
                sentimentDelta >= 0
                  ? "text-mint font-medium"
                  : "text-coral font-medium"
              }
            >
              {sentimentDelta >= 0 ? "up" : "down"} {Math.abs(sentimentDelta)}%
            </span>{" "}
            from start of week
          </p>
        </div>
      </div>
    </div>
  );
}
