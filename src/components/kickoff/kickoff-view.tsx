"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Headphones, Play, Pause, Sparkles } from "lucide-react";

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
      // Fetch drops first
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
      // No real audio — toggle visual waveform animation for demo
      setPlaying(!playing);
      if (!playing) {
        setTimeout(() => setPlaying(false), briefingItems.length * 15 * 1000);
      }
    }
  }, [playing, audioUrl, briefingItems.length]);

  return (
    <div className="pt-16 pb-20 px-4 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-lg font-semibold">Kickoff Briefing</h1>
        <p className="text-xs text-cream-dim mt-1">
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
            className="flex flex-col items-center gap-6 mt-12"
          >
            <div className="w-24 h-24 bg-midnight-light rounded-3xl flex items-center justify-center border border-white/5">
              <Headphones size={40} className="text-cream-dim" />
            </div>
            <div className="text-center">
              <h2 className="text-base font-medium mb-1">Welcome back!</h2>
              <p className="text-sm text-cream-dim">
                You missed{" "}
                <span className="text-coral font-medium">12 drops</span> across
                3 days.
              </p>
              <p className="text-sm text-cream-dim">
                Generate a personalized audio briefing?
              </p>
            </div>
            <button
              onClick={handleGenerate}
              className="flex items-center gap-2 px-6 py-3 bg-coral rounded-xl text-white font-medium hover:bg-coral-dark transition-colors active:scale-95"
            >
              <Sparkles size={16} />
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
            className="flex flex-col items-center gap-6 mt-12"
          >
            <div className="w-24 h-24 bg-midnight-light rounded-3xl flex items-center justify-center border border-coral/20 relative overflow-hidden">
              <div
                className="absolute bottom-0 left-0 right-0 bg-coral/20 transition-all duration-300"
                style={{ height: `${progress}%` }}
              />
              <Sparkles
                size={40}
                className="text-coral relative z-10 animate-pulse"
              />
            </div>
            <div className="text-center">
              <h2 className="text-base font-medium mb-1">
                Generating briefing...
              </h2>
              <p className="text-sm text-cream-dim">
                Scanning drops, extracting what matters to you.
              </p>
            </div>
            <div className="w-48 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-coral rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </motion.div>
        )}

        {ready && (
          <motion.div
            key="ready"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="bg-midnight-light rounded-2xl border border-mint/20 p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-medium text-mint">
                    Your Kickoff is ready
                  </h3>
                  <p className="text-xs text-cream-dim mt-0.5">
                    {Math.ceil(briefingItems.length * 15 / 60)}:{String((briefingItems.length * 15) % 60).padStart(2, "0")} · Covers May 1–3
                  </p>
                </div>
                <button
                  onClick={togglePlay}
                  className="w-12 h-12 bg-mint rounded-full flex items-center justify-center hover:bg-mint-dark transition-colors active:scale-95"
                >
                  {playing ? (
                    <Pause size={20} className="text-midnight" />
                  ) : (
                    <Play size={20} className="text-midnight ml-0.5" />
                  )}
                </button>
              </div>

              {playing && (
                <div className="flex items-end gap-[2px] h-8 w-full mb-2">
                  {Array.from({ length: 50 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-mint rounded-full waveform-bar"
                      style={{
                        animationDelay: `${i * 0.04}s`,
                        animationDuration: `${0.4 + Math.random() * 0.6}s`,
                      }}
                    />
                  ))}
                </div>
              )}

              {!audioUrl && (
                <p className="text-[10px] text-cream-dim mt-2">
                  Audio generation available when ElevenLabs is connected
                </p>
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-xs text-cream-dim uppercase tracking-wider mb-3">
                Briefing Outline
              </h3>
              {briefingItems.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-3 py-2"
                >
                  <span className="text-xs font-mono text-cream-dim w-8 shrink-0">
                    {formatTimestamp(i)}
                  </span>
                  <p className="text-sm text-cream/70">{item}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
