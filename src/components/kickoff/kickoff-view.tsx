"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Headphones, Play, Pause, Sparkles } from "lucide-react";

export function KickoffView() {
  const [generating, setGenerating] = useState(false);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleGenerate = () => {
    setGenerating(true);
    let p = 0;
    const interval = setInterval(() => {
      p += 2;
      setProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setGenerating(false);
        setReady(true);
      }
    }, 60);
  };

  const briefingItems = [
    {
      time: "0:00",
      text: "While you were away, the team shipped 3 features and resolved 5 blockers.",
    },
    {
      time: "0:15",
      text: "Marco deployed the caching layer — API latency is down 40%. The webhook integration is next.",
    },
    {
      time: "0:30",
      text: "Aya is blocked on staging DB access. She mentioned you specifically — credentials are needed.",
    },
    {
      time: "0:45",
      text: "Priya finalized the Q3 roadmap. Sprint demo moved to Friday for timezone overlap with Sydney.",
    },
    {
      time: "1:00",
      text: "Jordan completed the Kubernetes migration with zero downtime. SSL certs expire in 3 days — needs sign-off.",
    },
    {
      time: "1:15",
      text: "Team sentiment is up 8% this week. No critical unresolved items blocking your work directly.",
    },
  ];

  return (
    <div className="pt-16 pb-20 px-4 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-lg font-semibold">Kickoff Briefing</h1>
        <p className="text-xs text-cream-dim mt-1">
          Back from PTO? Get caught up in 90 seconds.
        </p>
      </div>

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
                You missed <span className="text-coral font-medium">12 drops</span> across 3 days.
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
              <Sparkles size={40} className="text-coral relative z-10 animate-pulse" />
            </div>
            <div className="text-center">
              <h2 className="text-base font-medium mb-1">Generating briefing...</h2>
              <p className="text-sm text-cream-dim">
                Scanning 12 drops, extracting what matters to you.
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
                  <h3 className="text-sm font-medium text-mint">Your Kickoff is ready</h3>
                  <p className="text-xs text-cream-dim mt-0.5">1:30 · Covers May 1–3</p>
                </div>
                <button
                  onClick={() => setPlaying(!playing)}
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
                    {item.time}
                  </span>
                  <p className="text-sm text-cream/70">{item.text}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
