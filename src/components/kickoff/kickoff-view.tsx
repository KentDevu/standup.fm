"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Sparkles, Clock, ArrowRight, Check } from "lucide-react";

const FALLBACK_ITEMS = [
  "While you were away, the team shipped 3 features and resolved 5 blockers.",
  "Marco deployed the caching layer — API latency is down 40%. The webhook integration is next.",
  "Aya is blocked on staging DB access. She mentioned you specifically — credentials are needed.",
  "Priya finalized the Q3 roadmap. Sprint demo moved to Friday for timezone overlap with Sydney.",
  "Jordan completed the Kubernetes migration with zero downtime. SSL certs expire in 3 days — needs sign-off.",
  "Team sentiment is up 8% this week. No critical unresolved items blocking your work directly.",
];

function seededWave(seed: number, n: number) {
  const arr: number[] = [];
  let s = seed * 9301 + 49297;
  for (let i = 0; i < n; i++) {
    s = (s * 9301 + 49297) % 233280;
    arr.push(0.25 + (s / 233280) * 0.75);
  }
  return arr;
}

const CHAPTERS = [
  { t: 0, label: "Yesterday", note: "Onboarding v3 shipped · realtime layer migrated" },
  { t: 42, label: "Today", note: "Empty-state polish · 2FA staff rollout · RFC review" },
  { t: 96, label: "Blockers", note: "Realtime needs security review (Jordan)" },
  { t: 132, label: "Vibes", note: "Sentiment up 8% — onboarding win felt by all" },
];

function HighlightItem({ color, label, bold }: { color: string; label: string; bold: string }) {
  return (
    <li className="text-ink-2 text-sm flex items-center gap-2.5">
      <span
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ background: color, boxShadow: `0 0 12px ${color}` }}
      />
      <span>{label} <b className="text-ink">{bold}</b></span>
    </li>
  );
}

function fmt(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function KickoffView() {
  const [generating, setGenerating] = useState(false);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(42);
  const [progress, setProgress] = useState(0);
  const [briefingItems, setBriefingItems] = useState<string[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const total = 184;

  const waveData = useMemo(() => seededWave(99, 80), []);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setPos((p) => Math.min(total, p + 1)), 1000);
    return () => clearInterval(id);
  }, [playing]);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 1, 90));
    }, 80);

    try {
      let drops: unknown[] = [];
      try {
        const dropsRes = await fetch("/api/drops");
        if (dropsRes.ok) drops = await dropsRes.json();
      } catch {
        // no drops available
      }

      const res = await fetch("/api/kickoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drops }),
      });

      if (res.ok) {
        const data = await res.json();
        setBriefingItems(data.items?.length ? data.items : FALLBACK_ITEMS);
        if (data.audio_url) setAudioUrl(data.audio_url);
      } else {
        setBriefingItems(FALLBACK_ITEMS);
      }
    } catch {
      setBriefingItems(FALLBACK_ITEMS);
    }

    clearInterval(progressInterval);
    setProgress(100);

    setTimeout(() => {
      setGenerating(false);
      setReady(true);
    }, 300);
  }, []);

  const togglePlay = useCallback(() => {
    if (audioUrl && audioRef.current) {
      if (playing) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setPlaying(!playing);
    } else {
      setPlaying(!playing);
      if (!playing) {
        setTimeout(() => setPlaying(false), total * 1000);
      }
    }
  }, [playing, audioUrl]);

  return (
    <div className="max-w-5xl mx-auto w-full">
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setPlaying(false)}
          className="hidden"
        />
      )}

      <AnimatePresence mode="wait">
        {!generating && !ready && (
          <motion.section
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass rounded-[20px] relative overflow-hidden flex flex-col items-center gap-3.5 text-center min-h-[60vh] justify-center p-[clamp(30px,5vw,60px)]"
          >
            <div
              className="absolute w-[480px] h-[480px] rounded-full opacity-50 z-0"
              style={{
                background: "radial-gradient(circle, #A78BFA, transparent 60%)",
                filter: "blur(60px)",
              }}
            />
            <div className="relative z-10 flex flex-col items-center gap-3.5">
              <h2 className="text-[clamp(22px,2.6vw,34px)] font-semibold tracking-tight mt-2">No briefing yet</h2>
              <p className="text-ink-3 max-w-[50ch]">
                When your team drops in, we&apos;ll generate a 90-second AI briefing here every morning at 9am.
              </p>
              <div className="flex gap-2.5 flex-wrap justify-center mt-1">
                <button
                  onClick={handleGenerate}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-br from-accent-a to-accent-b text-[#0a0a14] text-[13px] font-semibold shadow-[0_12px_30px_-10px_rgba(167,139,250,0.6)] hover:-translate-y-0.5 transition-all"
                >
                  Generate sample <Sparkles size={14} />
                </button>
                <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-line bg-glass-bg text-ink-2 text-[13px] font-medium hover:text-ink hover:border-line-2 transition-all">
                  Schedule briefing
                </button>
              </div>
              <div className="flex gap-4.5 flex-wrap justify-center text-ink-3 text-xs mt-3.5">
                <span className="inline-flex items-center gap-1.5"><Check size={14} className="text-accent-a" /> Auto-summarizes every drop</span>
                <span className="inline-flex items-center gap-1.5"><Check size={14} className="text-accent-a" /> Highlights blockers</span>
                <span className="inline-flex items-center gap-1.5"><Check size={14} className="text-accent-a" /> Reads in your voice</span>
              </div>
            </div>
          </motion.section>
        )}

        {generating && (
          <motion.div
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-8 min-h-[60vh] justify-center"
          >
            <div className="w-28 h-28 md:w-32 md:h-32 glass rounded-3xl flex items-center justify-center relative overflow-hidden !border-accent-a/15">
              <div
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-accent-a/20 to-transparent transition-all duration-300"
                style={{ height: `${progress}%` }}
              />
              <Sparkles
                size={48}
                className="text-accent-a relative z-10 animate-pulse"
              />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">
                Generating briefing...
              </h2>
              <p className="text-sm text-ink-3">
                Scanning drops, extracting what matters to you.
              </p>
            </div>
            <div className="w-56 h-2 glass-subtle rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-accent-a to-accent-c rounded-full"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        )}

        {ready && (
          <motion.div
            key="ready"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4 items-start"
          >
            <div className="glass rounded-[20px] p-[clamp(22px,3vw,36px)]">
              <div className="inline-flex items-center gap-2 text-xs text-ink-3 uppercase tracking-[0.12em]">
                <span className="w-2 h-2 rounded-full bg-accent-a shadow-[0_0_12px_var(--color-accent-a)]" />
                Today&apos;s Kickoff · 9:00 AM
              </div>
              <h1 className="text-[clamp(34px,5.4vw,64px)] leading-[1.04] tracking-[-0.035em] font-semibold mt-2 mb-3.5 text-balance">
                Good morning,<br />
                <span className="gradient-text">here&apos;s the room.</span>
              </h1>
              <p className="text-ink-2 text-[clamp(14px,1.2vw,16px)] max-w-[60ch] leading-relaxed mb-5">
                A 90-second briefing, stitched from {briefingItems.length} drops by your team. Generated 3 minutes ago.
              </p>

              <div className="flex items-center gap-4 p-4.5 border border-line rounded-[14px] bg-gradient-to-b from-white/[0.04] to-white/[0.01] max-[540px]:flex-col max-[540px]:items-stretch max-[540px]:gap-3">
                <button
                  onClick={togglePlay}
                  className="w-[60px] h-[60px] rounded-full shrink-0 border-0 cursor-pointer text-[#0a0a14] bg-gradient-to-br from-accent-a to-accent-b grid place-items-center shadow-[0_14px_40px_-10px_rgba(167,139,250,0.8)] max-[540px]:w-[52px] max-[540px]:h-[52px] max-[540px]:self-center"
                >
                  {playing ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}
                </button>
                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                  <div className="flex items-center gap-[2px] h-12">
                    {waveData.map((v, i) => {
                      const past = (i / 80) * total < pos;
                      return (
                        <span
                          key={i}
                          className="flex-1 min-w-[2px] rounded-[1.5px] transition-colors duration-200"
                          style={{
                            height: `${v * 100}%`,
                            background: past ? "#A78BFA" : "rgba(255,255,255,0.12)",
                          }}
                        />
                      );
                    })}
                  </div>
                  <div className="flex justify-between font-mono text-[11px] text-ink-3 tabular-nums">
                    <span>{fmt(pos)}</span>
                    <span>{fmt(total)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap mt-4.5">
                <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-line bg-glass-bg text-ink-2 text-[13px] font-medium hover:text-ink hover:border-line-2 transition-all">
                  1.0×
                </button>
                <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-line bg-glass-bg text-ink-2 text-[13px] font-medium hover:text-ink hover:border-line-2 transition-all">
                  Transcript
                </button>
                <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-line bg-glass-bg text-ink-2 text-[13px] font-medium hover:text-ink hover:border-line-2 transition-all">
                  Share
                </button>
                <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-br from-accent-a to-accent-b text-[#0a0a14] text-[13px] font-semibold shadow-[0_12px_30px_-10px_rgba(167,139,250,0.6)] hover:-translate-y-0.5 transition-all">
                  Send to Slack <ArrowRight size={14} />
                </button>
              </div>

              {!audioUrl && (
                <p className="text-[10px] text-ink-4 mt-3">
                  Audio generation available when ElevenLabs is connected
                </p>
              )}
            </div>

            <div className="grid gap-4">
              <div className="glass rounded-[20px] p-[clamp(18px,2.4vw,28px)]">
                <div className="text-ink-3 text-xs tracking-[0.06em] uppercase font-medium">Chapters</div>
                <ul className="grid gap-1.5 mt-3.5">
                  {CHAPTERS.map((c, i) => {
                    const active = pos >= c.t && (i === CHAPTERS.length - 1 || pos < CHAPTERS[i + 1].t);
                    return (
                      <li
                        key={c.t}
                        onClick={() => setPos(c.t)}
                        className={`grid gap-3.5 items-start p-2.5 px-3 rounded-[14px] cursor-pointer border transition-all duration-150 ${
                          active
                            ? "bg-accent-a/[0.12] border-accent-a/40"
                            : "border-transparent hover:bg-glass-bg hover:border-line"
                        }`}
                        style={{ gridTemplateColumns: "56px 1fr" }}
                      >
                        <span className="font-mono text-xs text-accent-a pt-0.5">{fmt(c.t)}</span>
                        <div>
                          <div className="font-semibold text-sm">{c.label}</div>
                          <div className="text-ink-3 text-xs leading-relaxed mt-0.5">{c.note}</div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="glass rounded-[20px] p-[clamp(18px,2.4vw,28px)]">
                <div className="text-ink-3 text-xs tracking-[0.06em] uppercase font-medium">Highlights</div>
                <ul className="grid gap-2.5 mt-3.5">
                  <HighlightItem color="#A78BFA" label="Onboarding drop-off down" bold="18%" />
                  <HighlightItem color="#06B6D4" label="Latency p95" bold="220 → 58ms" />
                  <HighlightItem color="#FF6B6B" label="" bold="1 blocker needs review" />
                  <HighlightItem color="#7C3AED" label="Sentiment" bold="+8% wow" />
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
