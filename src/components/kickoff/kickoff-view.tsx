"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Headphones, Play, Pause, Sparkles, Clock } from "lucide-react";

const FALLBACK_ITEMS = [
  "While you were away, the team shipped 3 features and resolved 5 blockers.",
  "Marco deployed the caching layer — API latency is down 40%. The webhook integration is next.",
  "Aya is blocked on staging DB access. She mentioned you specifically — credentials are needed.",
  "Priya finalized the Q3 roadmap. Sprint demo moved to Friday for timezone overlap with Sydney.",
  "Jordan completed the Kubernetes migration with zero downtime. SSL certs expire in 3 days — needs sign-off.",
  "Team sentiment is up 8% this week. No critical unresolved items blocking your work directly.",
];

function formatTimestamp(index: number) {
  const seconds = index * 15;
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function KickoffView() {
  const [generating, setGenerating] = useState(false);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [briefingItems, setBriefingItems] = useState<string[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 1, 90));
    }, 80);

    try {
      let drops = [];
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
        setTimeout(() => setPlaying(false), briefingItems.length * 15 * 1000);
      }
    }
  }, [playing, audioUrl, briefingItems.length]);

  return (
    <div className="px-4 md:px-6 lg:px-8 py-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-xl md:text-2xl font-bold">Kickoff Briefing</h1>
        <p className="text-xs md:text-sm text-cream-dim mt-1">
          Back from PTO? Get caught up in 90 seconds.
        </p>
      </div>

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
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-8 mt-12 md:mt-20"
          >
            <div className="relative">
              <div className="w-28 h-28 md:w-32 md:h-32 glass-card rounded-3xl flex items-center justify-center animate-breathe">
                <Headphones size={48} className="text-cream-muted" />
              </div>
              <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-br from-orange to-rose flex items-center justify-center text-[10px] font-bold text-white shadow-lg shadow-orange/30 ring-2 ring-ember">
                12
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-xl md:text-2xl font-bold mb-2">Welcome back!</h2>
              <p className="text-sm text-cream-dim">
                You missed{" "}
                <span className="text-orange font-semibold">12 drops</span> across
                3 days.
              </p>
              <p className="text-sm text-cream-dim mt-1">
                Generate a personalized audio briefing?
              </p>
            </div>
            <button
              onClick={handleGenerate}
              className="flex items-center gap-2.5 px-8 py-4 bg-gradient-to-r from-orange via-[#F97316] to-rose rounded-xl text-white font-semibold shadow-xl shadow-orange/25 hover:shadow-2xl hover:shadow-orange/30 transition-all duration-300 active:scale-95"
            >
              <Sparkles size={18} />
              Generate Kickoff
            </button>
          </motion.div>
        )}

        {generating && (
          <motion.div
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-8 mt-12 md:mt-20"
          >
            <div className="w-28 h-28 md:w-32 md:h-32 glass-card rounded-3xl flex items-center justify-center relative overflow-hidden !border-orange/15">
              <div
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-orange/20 to-transparent transition-all duration-300"
                style={{ height: `${progress}%` }}
              />
              <Sparkles
                size={48}
                className="text-orange relative z-10 animate-pulse"
              />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold mb-2">
                Generating briefing...
              </h2>
              <p className="text-sm text-cream-dim">
                Scanning drops, extracting what matters to you.
              </p>
            </div>
            <div className="w-56 h-2 glass-subtle rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-orange to-gold rounded-full"
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
            className="space-y-5"
          >
            <div className="glass-card rounded-2xl p-5 !border-gold/12">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-bold gradient-text-gold">
                    Your Kickoff is ready
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock size={11} className="text-cream-muted" />
                    <p className="text-xs text-cream-dim font-mono tabular-nums">
                      {Math.ceil(briefingItems.length * 15 / 60)}:{String((briefingItems.length * 15) % 60).padStart(2, "0")} · Covers May 1–3
                    </p>
                  </div>
                </div>
                <button
                  onClick={togglePlay}
                  className="w-14 h-14 bg-gradient-to-br from-gold to-orange rounded-full flex items-center justify-center shadow-lg shadow-gold/25 hover:shadow-xl hover:shadow-gold/30 transition-all duration-200 active:scale-95"
                >
                  {playing ? (
                    <Pause size={22} className="text-ember" />
                  ) : (
                    <Play size={22} className="text-ember ml-0.5" />
                  )}
                </button>
              </div>

              {playing && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="flex items-end gap-[2px] h-10 w-full mb-3"
                >
                  {Array.from({ length: 60 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-gold to-orange rounded-full waveform-bar"
                      style={{
                        animationDelay: `${i * 0.03}s`,
                        animationDuration: `${0.4 + Math.random() * 0.6}s`,
                      }}
                    />
                  ))}
                </motion.div>
              )}

              {!audioUrl && (
                <p className="text-[10px] text-cream-muted mt-2">
                  Audio generation available when ElevenLabs is connected
                </p>
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-[11px] text-cream-muted uppercase tracking-[0.2em] font-semibold mb-4 px-1">
                Briefing Outline
              </h3>
              {briefingItems.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex gap-4 py-3.5 px-3 rounded-xl hover:bg-white/[0.015] transition-all duration-200 group border border-transparent hover:border-white/[0.03]"
                >
                  <span className="text-[11px] font-mono text-cream-muted w-8 shrink-0 tabular-nums pt-0.5 group-hover:text-orange transition-colors">
                    {formatTimestamp(i)}
                  </span>
                  <p className="text-sm text-cream/60 leading-relaxed group-hover:text-cream/80 transition-colors">{item}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
