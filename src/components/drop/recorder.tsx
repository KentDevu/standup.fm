"use client";

import { useEffect, useState } from "react";
import {
  Mic,
  Square,
  RotateCcw,
  Send,
  Loader2,
  AlertCircle,
} from "lucide-react";
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
    audioBlob,
    transcript,
    extractions,
    processingStep,
    processingError,
    maxDuration,
    startCountdown,
    stopRecording,
    processAndDrop,
    reset,
  } = useRecorder();

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!audioBlob) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(audioBlob);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [audioBlob]);

  const progress = (elapsed / maxDuration) * 100;

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-8rem)] lg:min-h-dvh px-6">
      <AnimatePresence mode="wait">
        {state === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center gap-10"
          >
            <div className="text-center">
              <h1 className="text-3xl md:text-5xl font-bold mb-3 leading-tight">
                <span className="gradient-text">Drop your standup</span>
              </h1>
              <p className="text-cream-dim text-sm md:text-base">
                60 seconds. No slides. Just talk.
              </p>
            </div>

            <div className="flex gap-4 md:gap-8">
              {PROMPTS.map((p, i) => (
                <motion.span
                  key={p}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="text-xs md:text-sm text-cream-muted font-medium uppercase tracking-widest"
                >
                  {p}
                </motion.span>
              ))}
            </div>

            <div className="relative">
              <div className="absolute -inset-5 bg-orange/12 rounded-full animate-pulse-ring" />
              <div className="absolute -inset-10 bg-orange/5 rounded-full animate-pulse-ring" style={{ animationDelay: "0.6s" }} />
              <div className="absolute -inset-16 bg-orange/3 rounded-full animate-pulse-ring" style={{ animationDelay: "1.2s" }} />
              <button
                onClick={startCountdown}
                className="relative w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-orange via-[#F97316] to-rose rounded-full flex items-center justify-center shadow-2xl shadow-orange/30 hover:shadow-orange/40 transition-all duration-300 active:scale-95 animate-pulse-glow group"
              >
                <Mic size={48} className="text-white group-hover:scale-110 transition-transform" />
              </button>
            </div>

            <p className="text-cream-muted text-[11px] font-mono tracking-[0.2em] uppercase">
              Tap to record
            </p>
          </motion.div>
        )}

        {state === "countdown" && (
          <motion.div
            key="countdown"
            initial={{ opacity: 0, scale: 2.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: "spring", damping: 15 }}
            className="flex flex-col items-center gap-4"
          >
            <span className="text-9xl md:text-[10rem] font-bold gradient-text tabular-nums leading-none">
              {countdown}
            </span>
            <span className="text-cream-dim text-sm tracking-wider">Get ready...</span>
          </motion.div>
        )}

        {state === "recording" && (
          <motion.div
            key="recording"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6 w-full max-w-md"
          >
            <div className="flex gap-4 md:gap-6">
              {PROMPTS.map((p, i) => (
                <motion.span
                  key={p}
                  animate={{
                    color: i <= Math.floor(elapsed / 20) ? "#FB923C" : "#78716C",
                    opacity: i <= Math.floor(elapsed / 20) ? 1 : 0.4,
                  }}
                  className="font-semibold text-xs md:text-sm uppercase tracking-widest"
                >
                  {p}
                </motion.span>
              ))}
            </div>

            <div className="relative w-32 h-32 md:w-40 md:h-40">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke="rgba(255,255,255,0.04)"
                  strokeWidth="3"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke="url(#progress-gradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${progress * 2.89} 289`}
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="progress-gradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FB923C" />
                    <stop offset="100%" stopColor="#F43F5E" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl md:text-4xl font-bold font-mono text-cream tabular-nums">
                  {Math.floor(elapsed / 60)}:
                  {String(elapsed % 60).padStart(2, "0")}
                </span>
                <span className="text-[10px] text-cream-muted uppercase tracking-[0.2em] mt-1">recording</span>
              </div>
            </div>

            <LiveWaveform />

            <button
              onClick={stopRecording}
              className="w-16 h-16 bg-gradient-to-br from-rose to-rose-dark rounded-2xl flex items-center justify-center hover:shadow-lg hover:shadow-rose/20 transition-all duration-200 active:scale-95"
            >
              <Square size={22} className="text-white" fill="white" />
            </button>
          </motion.div>
        )}

        {state === "preview" && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center gap-6 w-full max-w-md"
          >
            <h3 className="text-xl md:text-2xl font-bold">Preview your drop</h3>

            <div className="w-full glass-card rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-orange animate-glow-pulse" />
                <span className="text-xs text-cream-dim font-mono tabular-nums">
                  {elapsed}s recorded
                </span>
              </div>
              {previewUrl ? (
                <audio
                  src={previewUrl}
                  controls
                  className="w-full h-8"
                  style={{ colorScheme: "dark" }}
                />
              ) : (
                <p className="text-xs text-cream-dim">
                  Audio captured. Tap &quot;Drop it&quot; to transcribe and
                  process.
                </p>
              )}
            </div>

            <div className="flex gap-3 w-full">
              <button
                onClick={reset}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border border-white/[0.08] text-cream-dim hover:text-cream hover:border-white/15 hover:bg-white/[0.02] transition-all duration-200"
              >
                <RotateCcw size={16} />
                <span className="text-sm font-medium">Re-record</span>
              </button>
              <button
                onClick={processAndDrop}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-orange to-rose text-white font-semibold shadow-lg shadow-orange/20 hover:shadow-xl hover:shadow-orange/25 transition-all duration-200"
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
            className="flex flex-col items-center gap-6 w-full max-w-md"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange/15 to-rose/10 flex items-center justify-center border border-orange/10">
              <Loader2 size={28} className="text-orange animate-spin" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold mb-1.5">
                Processing your drop
              </h3>
              <p className="text-sm text-cream-dim">{processingStep}</p>
            </div>

            {processingError && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full glass-card rounded-2xl p-4 !border-rose/15 flex items-start gap-3"
              >
                <AlertCircle size={16} className="text-rose shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-rose font-semibold mb-0.5">
                    Pipeline error
                  </p>
                  <p className="text-xs text-cream-dim">{processingError}</p>
                  <button
                    onClick={reset}
                    className="text-xs text-orange hover:underline mt-2 font-medium"
                  >
                    Try again
                  </button>
                </div>
              </motion.div>
            )}

            {transcript && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full glass-card rounded-2xl p-5"
              >
                <p className="text-[10px] text-cream-muted mb-2 uppercase tracking-[0.2em] font-semibold">
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
            transition={{ type: "spring", damping: 12 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", delay: 0.1, damping: 10 }}
              className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-gold/15 to-gold/5 flex items-center justify-center border border-gold/15"
            >
              <span className="text-5xl">🎙️</span>
            </motion.div>
            <h3 className="text-2xl font-bold gradient-text-gold mb-1">Drop saved.</h3>
            <p className="text-cream-dim text-sm mb-8">Go build.</p>

            {extractions.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center mb-8">
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
              className="text-sm text-cream-dim hover:text-orange transition-colors font-medium"
            >
              Record another
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
