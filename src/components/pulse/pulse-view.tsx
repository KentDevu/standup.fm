"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Mail,
  CheckCircle,
  Mic,
  Users,
  ShieldAlert,
  Loader2,
  Clock,
} from "lucide-react";
import { Sparkline } from "@/components/ui/sparkline";
import { mockPulseMetrics, mockInsights } from "@/lib/mock-data";
import { PulseMetrics, AIInsight } from "@/types";

interface PulseStats {
  drops_today: number;
  active_members_today: number;
  total_users: number;
  open_blockers: number;
  total_drops_week: number;
}

function StatCard({
  icon: Icon,
  iconColor,
  iconBg,
  value,
  suffix,
  label,
  alert,
  delay,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconColor: string;
  iconBg: string;
  value: number | string;
  suffix?: string;
  label: string;
  alert?: boolean;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`glass-card rounded-2xl p-5 flex flex-col items-center gap-3 ${alert ? "!border-rose/12" : ""}`}
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg}`}>
        <Icon size={18} className={iconColor} />
      </div>
      <div className="text-center">
        <span className={`text-3xl font-bold tabular-nums ${alert ? "text-rose" : "text-cream"}`}>
          {value}
        </span>
        {suffix && (
          <span className="text-sm font-normal text-cream-dim">{suffix}</span>
        )}
      </div>
      <span className="text-[11px] text-cream-dim font-medium">{label}</span>
    </motion.div>
  );
}

export function PulseView() {
  const [metrics, setMetrics] = useState<PulseMetrics | null>(null);
  const [stats, setStats] = useState<PulseStats | null>(null);
  const [dayLabels, setDayLabels] = useState<string[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);
  const [digestSending, setDigestSending] = useState(false);
  const [digestSent, setDigestSent] = useState(false);
  const [digestError, setDigestError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPulse() {
      setLoading(true);
      try {
        const res = await fetch("/api/pulse");
        if (res.ok) {
          const data = await res.json();
          if (data.metrics) setMetrics(data.metrics);
          if (data.stats) setStats(data.stats);
          if (data.day_labels?.length) setDayLabels(data.day_labels);
          if (data.insights?.length) setInsights(data.insights);
          setIsMock(data.fallback === true);
        }
      } catch {
        setMetrics(mockPulseMetrics);
        setInsights(mockInsights);
        setIsMock(true);
      } finally {
        setLoading(false);
      }
    }
    fetchPulse();
  }, []);

  const displayMetrics = metrics ?? mockPulseMetrics;

  const totalBlockers = displayMetrics.blocker_frequency.reduce(
    (a, b) => a + b,
    0,
  );
  const avgResolution =
    displayMetrics.resolution_time.reduce((a, b) => a + b, 0) /
    displayMetrics.resolution_time.length;
  const latestSentiment =
    displayMetrics.sentiment_trend[displayMetrics.sentiment_trend.length - 1];
  const firstSentiment = displayMetrics.sentiment_trend[0];
  const sentimentDelta = Math.round((latestSentiment - firstSentiment) * 100);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 size={28} className="text-orange animate-spin mb-3" />
        <p className="text-sm text-cream-dim">Loading team pulse...</p>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-6 lg:px-8 py-6 max-w-5xl mx-auto">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Team Pulse</h1>
          <p className="text-xs md:text-sm text-cream-dim mt-1">
            A mirror for your team, not a manager dashboard.
          </p>
        </div>
        {isMock && (
          <span className="text-[10px] text-cream-muted glass-subtle rounded-full px-2.5 py-1 font-semibold">
            demo data
          </span>
        )}
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
          <StatCard
            icon={Mic}
            iconColor="text-orange"
            iconBg="bg-orange/8"
            value={stats.drops_today}
            label="Drops today"
            delay={0}
          />
          <StatCard
            icon={Users}
            iconColor="text-gold"
            iconBg="bg-gold/8"
            value={stats.active_members_today}
            suffix={`/${stats.total_users}`}
            label="Active today"
            delay={0.05}
          />
          <StatCard
            icon={ShieldAlert}
            iconColor={stats.open_blockers > 0 ? "text-rose" : "text-cream-muted"}
            iconBg={stats.open_blockers > 0 ? "bg-rose/8" : "bg-white/[0.03]"}
            value={stats.open_blockers}
            label="Open blockers"
            alert={stats.open_blockers > 0}
            delay={0.1}
          />
        </div>
      )}

      {insights.length > 0 && (
        <div className="space-y-2.5 mb-6">
          {insights.map((insight, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`glass-card rounded-xl p-4 flex items-start gap-3 ${
                insight.severity === "warning"
                  ? "!border-orange/12"
                  : insight.severity === "critical"
                    ? "!border-rose/12"
                    : "!border-gold/12"
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                insight.severity === "warning"
                  ? "bg-orange/8"
                  : insight.severity === "critical"
                    ? "bg-rose/8"
                    : "bg-gold/8"
              }`}>
                {insight.severity === "warning" || insight.severity === "critical" ? (
                  <AlertTriangle
                    size={14}
                    className={insight.severity === "critical" ? "text-rose" : "text-orange"}
                  />
                ) : (
                  <TrendingUp size={14} className="text-gold" />
                )}
              </div>
              <p className="text-sm text-cream/75 leading-relaxed">{insight.message}</p>
            </motion.div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
        <Sparkline
          data={displayMetrics.blocker_frequency}
          color="rose"
          label="Blockers / Day"
          value={String(
            displayMetrics.blocker_frequency[
              displayMetrics.blocker_frequency.length - 1
            ],
          )}
          unit="today"
          dayLabels={dayLabels}
        />
        <Sparkline
          data={displayMetrics.resolution_time}
          color="amber"
          label="Resolution Time"
          value={displayMetrics.resolution_time[
            displayMetrics.resolution_time.length - 1
          ].toFixed(1)}
          unit="hrs avg"
          dayLabels={dayLabels}
        />
        <Sparkline
          data={displayMetrics.participation}
          color="gold"
          label="Participation"
          value={String(
            displayMetrics.participation[
              displayMetrics.participation.length - 1
            ],
          )}
          unit="% today"
          dayLabels={dayLabels}
        />
        <Sparkline
          data={displayMetrics.sentiment_trend}
          color="orange"
          label="Sentiment"
          value={Math.round(
            displayMetrics.sentiment_trend[
              displayMetrics.sentiment_trend.length - 1
            ] * 100,
          ).toString()}
          unit="% positive"
          dayLabels={dayLabels}
        />
      </div>

      <div className="mt-6 glass-card rounded-2xl p-5">
        <h3 className="text-sm font-bold mb-4">This Week Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white/[0.015] border border-white/[0.03]">
            <div className="w-9 h-9 rounded-lg bg-rose/8 flex items-center justify-center shrink-0">
              <ShieldAlert size={15} className="text-rose" />
            </div>
            <div>
              <p className="text-sm font-semibold text-cream">
                {totalBlockers} blockers raised
              </p>
              <p className="text-xs text-cream-muted">
                {stats?.open_blockers ?? "—"} still open
              </p>
            </div>
          </div>
          {stats && (
            <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white/[0.015] border border-white/[0.03]">
              <div className="w-9 h-9 rounded-lg bg-gold/8 flex items-center justify-center shrink-0">
                <Mic size={15} className="text-gold" />
              </div>
              <div>
                <p className="text-sm font-semibold text-cream">
                  {stats.total_drops_week} standups
                </p>
                <p className="text-xs text-cream-muted">recorded this week</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white/[0.015] border border-white/[0.03]">
            <div className="w-9 h-9 rounded-lg bg-orange/8 flex items-center justify-center shrink-0">
              <Clock size={15} className="text-orange" />
            </div>
            <div>
              <p className="text-sm font-semibold text-cream">
                {avgResolution.toFixed(1)} hrs
              </p>
              <p className="text-xs text-cream-muted">avg resolution time</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white/[0.015] border border-white/[0.03]">
            <div className="w-9 h-9 rounded-lg bg-amber-500/8 flex items-center justify-center shrink-0">
              {sentimentDelta >= 0 ? (
                <TrendingUp size={15} className="text-gold" />
              ) : (
                <TrendingDown size={15} className="text-rose" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-cream">
                Mood {sentimentDelta >= 0 ? "up" : "down"} {Math.abs(sentimentDelta)}%
              </p>
              <p className="text-xs text-cream-muted">from start of week</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 glass-card rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold">Daily Digest Email</h3>
            <p className="text-xs text-cream-dim mt-0.5">
              Send today&apos;s standup summary to your inbox.
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            disabled={digestSending || digestSent}
            onClick={async () => {
              setDigestSending(true);
              setDigestError(null);
              try {
                const res = await fetch("/api/digest", { method: "POST" });
                const data = await res.json();
                if (res.ok) {
                  setDigestSent(true);
                  setTimeout(() => setDigestSent(false), 5000);
                } else {
                  setDigestError(data.error ?? "Failed to send");
                }
              } catch {
                setDigestError("Network error — try again");
              } finally {
                setDigestSending(false);
              }
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 shrink-0 ${
              digestSent
                ? "bg-gold/10 text-gold border border-gold/15"
                : "bg-gradient-to-r from-orange to-rose text-white shadow-lg shadow-orange/20 hover:shadow-xl hover:shadow-orange/25"
            } disabled:opacity-60`}
          >
            {digestSending ? (
              <Loader2 size={13} className="animate-spin" />
            ) : digestSent ? (
              <CheckCircle size={13} />
            ) : (
              <Mail size={13} />
            )}
            {digestSending
              ? "Sending..."
              : digestSent
                ? "Sent!"
                : "Send digest"}
          </motion.button>
        </div>
        {digestError && (
          <p className="mt-2 text-xs text-rose">{digestError}</p>
        )}
      </div>
    </div>
  );
}
