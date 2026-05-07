"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Mail,
  CheckCircle,
  Loader2,
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

function seededWave(seed: number, n: number) {
  const arr: number[] = [];
  let s = seed * 9301 + 49297;
  for (let i = 0; i < n; i++) {
    s = (s * 9301 + 49297) % 233280;
    arr.push(0.25 + (s / 233280) * 0.75);
  }
  return arr;
}

function MetricCard({
  label,
  value,
  delta,
  data,
  color,
  sub,
}: {
  label: string;
  value: string;
  delta: number;
  data: number[];
  color: string;
  sub: string;
}) {
  const up = delta >= 0;
  const colorMap: Record<string, string> = {
    violet: "#A78BFA",
    cyan: "#06B6D4",
    rose: "#FF6B6B",
    purple: "#7C3AED",
  };
  const strokeColor = colorMap[color] || color;

  const w = 100, h = 36;
  const max = Math.max(...data), min = Math.min(...data);
  const norm = (v: number) => h - ((v - min) / (max - min || 1)) * h;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${norm(v)}`).join(" ");

  return (
    <div className="glass-card rounded-[14px] p-[18px] flex flex-col gap-1.5 min-h-[150px]">
      <div className="flex items-center justify-between">
        <span className="text-ink-3 text-xs tracking-[0.06em] uppercase font-medium whitespace-nowrap">{label}</span>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${up ? "text-[#5EEAD4] bg-[rgba(94,234,212,0.12)]" : "text-[#FFA1A1] bg-[rgba(255,107,107,0.12)]"}`}>
          {up ? "▲" : "▼"} {Math.abs(delta)}%
        </span>
      </div>
      <div className="text-[clamp(28px,3vw,40px)] font-semibold tracking-tight tabular-nums text-ink">{value}</div>
      {sub && <div className="text-ink-3 text-xs">{sub}</div>}
      <div className="mt-auto h-9">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full block" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`mg-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.5" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          <polyline points={`0,${h} ${pts} ${w},${h}`} fill={`url(#mg-${color})`} stroke="none" />
          <polyline points={pts} fill="none" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

function HeatGrid() {
  const people = ["MC", "JP", "SR", "BO", "PN", "DK"];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const rows = useMemo(() => people.map((_, p) => seededWave(p + 9, 7)), []);

  return (
    <div className="glass-card rounded-[14px] p-[18px]">
      <div className="flex items-end justify-between gap-3 flex-wrap mb-3.5">
        <div>
          <div className="text-ink-3 text-xs tracking-[0.06em] uppercase font-medium">Standup attendance</div>
          <div className="text-ink-3 text-xs mt-0.5">last 7 days · by person</div>
        </div>
        <div className="flex items-center gap-1.5 text-ink-3 text-[11px]">
          <span>low</span>
          <span className="inline-flex gap-0.5">
            {[0.2, 0.4, 0.6, 0.8, 1].map((o, i) => (
              <i key={i} className="w-3 h-3 rounded-[3px] block not-italic" style={{ background: `rgba(167,139,250,${o})` }} />
            ))}
          </span>
          <span>high</span>
        </div>
      </div>
      <div className="grid gap-1" style={{ gridTemplateColumns: "28px repeat(7, 1fr)" }}>
        <div />
        {days.map((d) => <div key={d} className="text-ink-3 text-[11px] text-center pb-0.5">{d}</div>)}
        {people.map((p, i) => (
          <React.Fragment key={p}>
            <div className="text-ink-3 text-[11px] self-center font-mono">{p}</div>
            {rows[i].map((v, j) => (
              <div
                key={j}
                className="aspect-square max-h-[30px] rounded border border-white/[0.04]"
                style={{ background: `rgba(167,139,250,${v.toFixed(2)})` }}
                title={`${p} · ${days[j]} · ${(v * 100).toFixed(0)}%`}
              />
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

import React from "react";

function SentimentRing() {
  const C = 2 * Math.PI * 44;
  const positive = 0.68, neutral = 0.22, neg = 0.10;

  return (
    <div className="glass-card rounded-[14px] p-[18px] flex flex-col gap-2.5 min-h-[220px]">
      <div className="text-ink-3 text-xs tracking-[0.06em] uppercase font-medium">Team sentiment</div>
      <div className="relative grid place-items-center py-1.5 flex-1">
        <svg viewBox="0 0 120 120" className="w-[clamp(120px,18vw,160px)] h-auto">
          <circle cx="60" cy="60" r="44" stroke="rgba(255,255,255,0.06)" strokeWidth="14" fill="none" />
          <circle cx="60" cy="60" r="44" stroke="#A78BFA" strokeWidth="14" fill="none"
            strokeDasharray={`${C * positive} ${C}`} strokeLinecap="round" transform="rotate(-90 60 60)" />
          <circle cx="60" cy="60" r="44" stroke="#06B6D4" strokeWidth="14" fill="none"
            strokeDasharray={`${C * neutral} ${C}`} strokeDashoffset={`${-C * positive}`} strokeLinecap="round" transform="rotate(-90 60 60)" />
          <circle cx="60" cy="60" r="44" stroke="#FF6B6B" strokeWidth="14" fill="none"
            strokeDasharray={`${C * neg} ${C}`} strokeDashoffset={`${-C * (positive + neutral)}`} strokeLinecap="round" transform="rotate(-90 60 60)" />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="text-[clamp(28px,3vw,38px)] font-semibold tracking-tight">68<span className="text-[0.55em] text-ink-3 ml-0.5 font-medium">%</span></div>
            <div className="text-ink-3 text-[11px] uppercase tracking-[0.12em]">positive</div>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-1 text-xs text-ink-2 mt-auto">
        <span className="flex items-center gap-2"><i className="inline-block w-2.5 h-2.5 rounded-[3px] bg-accent-a not-italic" /> Positive 68%</span>
        <span className="flex items-center gap-2"><i className="inline-block w-2.5 h-2.5 rounded-[3px] bg-accent-c not-italic" /> Neutral 22%</span>
        <span className="flex items-center gap-2"><i className="inline-block w-2.5 h-2.5 rounded-[3px] bg-[#FF6B6B] not-italic" /> Negative 10%</span>
      </div>
    </div>
  );
}

function TopicsCloud() {
  const topics = [
    { t: "onboarding", c: 14, w: 1.0 },
    { t: "infra", c: 11, w: 0.85 },
    { t: "blocked", c: 6, w: 0.55 },
    { t: "research", c: 9, w: 0.7 },
    { t: "design", c: 12, w: 0.92 },
    { t: "data", c: 7, w: 0.6 },
    { t: "security", c: 4, w: 0.4 },
  ];

  return (
    <div className="glass-card rounded-[14px] p-[18px]">
      <div className="flex items-center justify-between">
        <span className="text-ink-3 text-xs tracking-[0.06em] uppercase font-medium">Topics this week</span>
        <span className="text-ink-3 text-xs">auto-tagged</span>
      </div>
      <div className="flex flex-wrap gap-2 items-baseline pt-3">
        {topics.map((tp) => (
          <span
            key={tp.t}
            className="inline-flex items-baseline gap-1 border border-line bg-glass-bg px-2.5 py-1.5 rounded-full text-ink font-medium"
            style={{ fontSize: `${0.85 + tp.w * 0.6}rem`, opacity: 0.55 + tp.w * 0.45 }}
          >
            #{tp.t} <i className="text-ink-3 not-italic text-[0.75em]">{tp.c}</i>
          </span>
        ))}
      </div>
    </div>
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
  const [timeRange, setTimeRange] = useState("14d");

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

  const dropsData = useMemo(() => seededWave(7, 14).map((v) => v * 100), []);
  const listenData = useMemo(() => seededWave(11, 14).map((v) => v * 100), []);
  const blockedData = useMemo(() => seededWave(3, 14).map((v) => v * 100), []);
  const lengthData = useMemo(() => seededWave(5, 14).map((v) => 40 + v * 70), []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto w-full">
        <div className="px-1 pb-1 animate-pulse">
          <div className="h-3 w-32 rounded bg-white/[0.06] mb-2" />
          <div className="h-7 w-48 rounded bg-white/[0.06]" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-4 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card rounded-[14px] p-[18px] min-h-[150px] flex flex-col gap-2">
              <div className="h-2.5 w-16 rounded bg-white/[0.06]" />
              <div className="h-8 w-20 rounded bg-white/[0.06]" />
              <div className="mt-auto h-9 rounded bg-white/[0.04]" />
            </div>
          ))}
          <div className="sm:col-span-2 glass-card rounded-[14px] p-[18px] h-48" />
          <div className="glass-card rounded-[14px] p-[18px] h-48" />
          <div className="glass-card rounded-[14px] p-[18px] h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto w-full">
      <div className="flex items-end justify-between gap-4 flex-wrap px-1 pb-1">
        <div>
          <div className="inline-flex items-center gap-2 text-xs text-ink-3 uppercase tracking-[0.12em]">
            <span className="w-2 h-2 rounded-full bg-accent-a shadow-[0_0_12px_var(--color-accent-a)]" />
            Pulse · last 14 days
          </div>
          <h2 className="text-[clamp(22px,2.6vw,34px)] font-semibold tracking-tight mt-1.5">
            Team Pulse
          </h2>
        </div>
        <div className="inline-flex p-1 gap-0.5 border border-line rounded-full bg-glass-bg">
          {["7d", "14d", "30d", "90d"].map((s) => (
            <button
              key={s}
              onClick={() => setTimeRange(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                timeRange === s
                  ? "bg-gradient-to-br from-accent-a to-accent-b text-[#0a0a14] font-semibold"
                  : "text-ink-3 hover:text-ink"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {insights.length > 0 && (
        <div className="space-y-2.5 mt-4">
          {insights.map((insight, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`glass-card rounded-xl p-4 flex items-start gap-3 ${
                insight.severity === "warning"
                  ? "!border-[#FFB347]/12"
                  : insight.severity === "critical"
                    ? "!border-[#FF6B6B]/12"
                    : "!border-accent-a/12"
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                insight.severity === "warning"
                  ? "bg-[#FFB347]/8"
                  : insight.severity === "critical"
                    ? "bg-[#FF6B6B]/8"
                    : "bg-accent-a/8"
              }`}>
                {insight.severity === "warning" || insight.severity === "critical" ? (
                  <AlertTriangle
                    size={14}
                    className={insight.severity === "critical" ? "text-[#FF6B6B]" : "text-[#FFB347]"}
                  />
                ) : (
                  <TrendingUp size={14} className="text-accent-a" />
                )}
              </div>
              <p className="text-sm text-ink-2 leading-relaxed">{insight.message}</p>
            </motion.div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-4">
        <MetricCard label="Drops" value="142" delta={12} data={dropsData} color="violet" sub="this week" />
        <MetricCard label="Listens" value="1.2k" delta={28} data={listenData} color="cyan" sub="cross-team" />
        <MetricCard label="Blockers" value="3" delta={-40} data={blockedData} color="rose" sub="active" />
        <MetricCard label="Avg length" value="64s" delta={-8} data={lengthData} color="purple" sub="under 90s ✓" />

        <div className="sm:col-span-2">
          <HeatGrid />
        </div>
        <SentimentRing />
        <TopicsCloud />
      </div>

      <div className="mt-4 glass-card rounded-[20px] p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">Daily Digest Email</h3>
            <p className="text-xs text-ink-3 mt-0.5">
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
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold transition-all duration-200 shrink-0 ${
              digestSent
                ? "bg-accent-a/10 text-accent-a border border-accent-a/15"
                : "bg-gradient-to-r from-accent-a to-accent-b text-[#0a0a14] shadow-[0_12px_30px_-10px_rgba(167,139,250,0.6)] hover:-translate-y-0.5"
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
          <p className="mt-2 text-xs text-[#FF6B6B]">{digestError}</p>
        )}
      </div>
    </div>
  );
}
