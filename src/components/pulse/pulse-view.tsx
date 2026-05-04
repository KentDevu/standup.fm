"use client";

import { motion } from "framer-motion";
import { AlertTriangle, TrendingUp } from "lucide-react";
import { Sparkline } from "@/components/ui/sparkline";
import { mockPulseMetrics, mockInsights } from "@/lib/mock-data";

export function PulseView() {
  return (
    <div className="pt-16 pb-20 px-4 max-w-lg mx-auto">
      <div className="mb-4">
        <h1 className="text-lg font-semibold">Team Pulse</h1>
        <p className="text-xs text-cream-dim mt-1">
          A mirror for your team, not a manager dashboard.
        </p>
      </div>

      {mockInsights.length > 0 && (
        <div className="space-y-2 mb-6">
          {mockInsights.map((insight, i) => (
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
          data={mockPulseMetrics.blocker_frequency}
          color="coral"
          label="Blockers / Day"
          value={String(
            mockPulseMetrics.blocker_frequency[
              mockPulseMetrics.blocker_frequency.length - 1
            ]
          )}
          unit="today"
        />
        <Sparkline
          data={mockPulseMetrics.resolution_time}
          color="amber"
          label="Resolution Time"
          value={
            mockPulseMetrics.resolution_time[
              mockPulseMetrics.resolution_time.length - 1
            ].toFixed(1)
          }
          unit="hrs avg"
        />
        <Sparkline
          data={mockPulseMetrics.participation}
          color="mint"
          label="Participation"
          value={String(
            mockPulseMetrics.participation[
              mockPulseMetrics.participation.length - 1
            ]
          )}
          unit="% today"
        />
        <Sparkline
          data={mockPulseMetrics.sentiment_trend}
          color="blue"
          label="Sentiment"
          value={Math.round(
            mockPulseMetrics.sentiment_trend[
              mockPulseMetrics.sentiment_trend.length - 1
            ] * 100
          ).toString()}
          unit="% positive"
        />
      </div>

      <div className="mt-6 bg-midnight-light rounded-xl p-4 border border-white/5">
        <h3 className="text-sm font-medium mb-3">This Week Summary</h3>
        <div className="space-y-2 text-sm text-cream/70">
          <p>
            <span className="text-coral font-medium">7 blockers</span> raised,{" "}
            <span className="text-mint font-medium">5 resolved</span>
          </p>
          <p>
            Average resolution time:{" "}
            <span className="font-mono text-cream">4.1 hrs</span>
          </p>
          <p>
            Team mood trending{" "}
            <span className="text-mint font-medium">up 8%</span> from last
            week
          </p>
          <p>
            <span className="font-medium text-cream">Marco</span> was the top
            unblocker this week 🏆
          </p>
        </div>
      </div>
    </div>
  );
}
