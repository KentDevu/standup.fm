"use client";

import { Mic, Square, RotateCcw, Send, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LiveWaveform } from "@/components/ui/waveform";
import { TagChip } from "@/components/ui/tag-chip";
import { useRecorder } from "@/hooks/use-recorder";
import { ExtractionType } from "@/types";

const PROMPTS = ["Yesterday", "Today", "Blockers", "Asks"];

export function Recorder() {
  const {
    state,
    countdown,
    elapsed,
    transcript,
    extractions,
    processingStep,
    maxDuration,
    startCountdown,
    stopRecording,
    processAndDrop,
    reset,
  } = useRecorder();

  const progress = (elapsed / maxDuration) * 100;

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] px-6">
      <AnimatePresence mode="wait">
        {state === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center gap-8"
          >
            <div className="flex gap-6 text-sm text-cream-dim">
              {PROMPTS.map((p) => (
                <span key={p} className="opacity-50">
                  {p}
                </span>
              ))}
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-coral/20 rounded-full animate-pulse-ring" />
              <button
                onClick={startCountdown}
                className="relative w-28 h-28 bg-coral rounded-full flex items-center justify-center shadow-lg shadow-coral/25 hover:bg-coral-dark transition-colors active:scale-95"
              >
                <Mic size={40} className="text-white" />
              </button>
            </div>

            <p className="text-cream-dim text-sm">Tap to drop your standup</p>
          </motion.div>
        )}

        {state === "countdown" && (
          <motion.div
            key="countdown"
            initial={{ opacity: 0, scale: 2 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="text-7xl font-bold text-coral"
          >
            {countdown}
          </motion.div>
        )}

        {state === "recording" && (
          <motion.div
            key="recording"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6 w-full max-w-sm"
          >
            <div className="flex gap-6 text-sm">
              {PROMPTS.map((p, i) => (
                <span
                  key={p}
                  className={
                    i <= Math.floor(elapsed / 20)
                      ? "text-coral font-medium"
                      : "text-cream-dim opacity-50"
                  }
                >
                  {p}
                </span>
              ))}
            </div>

            <div className="relative w-28 h-28">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="4"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke="#FF6B6B"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${progress * 2.89} 289`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-mono text-cream">
                  {Math.floor(elapsed / 60)}:
                  {String(elapsed % 60).padStart(2, "0")}
                </span>
              </div>
            </div>

            <LiveWaveform />

            <button
              onClick={stopRecording}
              className="w-16 h-16 bg-coral rounded-2xl flex items-center justify-center hover:bg-coral-dark transition-colors active:scale-95"
            >
              <Square size={24} className="text-white" fill="white" />
            </button>
          </motion.div>
        )}

        {state === "preview" && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center gap-6 w-full max-w-sm"
          >
            <h3 className="text-lg font-semibold">Preview your drop</h3>

            <div className="w-full bg-midnight-light rounded-xl p-4 border border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-coral" />
                <span className="text-xs text-cream-dim font-mono">
                  {elapsed}s recorded
                </span>
              </div>
              <p className="text-xs text-cream-dim">
                Audio captured. Tap &quot;Drop it&quot; to transcribe and process.
              </p>
            </div>

            <div className="flex gap-3 w-full">
              <button
                onClick={reset}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 text-cream-dim hover:text-cream hover:border-white/20 transition-colors"
              >
                <RotateCcw size={16} />
                <span className="text-sm font-medium">Re-record</span>
              </button>
              <button
                onClick={processAndDrop}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-coral text-white font-medium hover:bg-coral-dark transition-colors"
              >
                <Send size={16} />
                <span className="text-sm">Drop it</span>
              </button>
            </div>
          </motion.div>
        )}

        {state === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6 w-full max-w-sm"
          >
            <Loader2 size={40} className="text-coral animate-spin" />
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-1">Processing your drop</h3>
              <p className="text-sm text-cream-dim">{processingStep}</p>
            </div>

            {transcript && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full bg-midnight-light rounded-xl p-4 border border-white/5"
              >
                <p className="text-xs text-cream-dim mb-2 uppercase tracking-wider">
                  Transcript
                </p>
                <p className="text-sm text-cream/80 leading-relaxed">
                  {transcript}
                </p>
              </motion.div>
            )}

            {extractions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap gap-2 w-full"
              >
                {extractions.map((ext, i) => (
                  <TagChip
                    key={i}
                    type={ext.type as ExtractionType}
                    content={ext.content}
                  />
                ))}
              </motion.div>
            )}
          </motion.div>
        )}

        {state === "dropped" && (
          <motion.div
            key="dropped"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <div className="text-5xl mb-4">🎙️</div>
            <h3 className="text-xl font-semibold text-mint">Drop saved.</h3>
            <p className="text-cream-dim text-sm mt-1 mb-6">Go build.</p>

            {extractions.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center mb-6">
                {extractions.map((ext, i) => (
                  <TagChip
                    key={i}
                    type={ext.type as ExtractionType}
                    content={ext.content}
                  />
                ))}
              </div>
            )}

            <button
              onClick={reset}
              className="text-sm text-cream-dim hover:text-cream transition-colors"
            >
              Record another
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
