"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Mic,
  Pause,
  RotateCcw,
  Send,
  Loader2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LiveWaveform } from "@/components/ui/waveform";
import { TagChip } from "@/components/ui/tag-chip";
import { useRecorder } from "@/hooks/use-recorder";
import { ExtractionType } from "@/types";

const PROMPTS = [
  "What did you ship yesterday?",
  "What's on deck today?",
  "Anything blocking you?",
];

function ChipStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card rounded-[14px] p-3.5 md:p-[14px_18px]">
      <div className="text-[clamp(20px,2.4vw,28px)] font-semibold tracking-tight tabular-nums text-ink">{value}</div>
      <div className="text-ink-3 text-xs tracking-[0.04em] uppercase mt-0.5">{label}</div>
    </div>
  );
}

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
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  const today = new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  return (
    <div className="max-w-5xl mx-auto w-full">
      <AnimatePresence mode="wait">
        {state === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-[1.05fr_1.2fr] gap-4"
          >
            <div className="glass rounded-[20px] p-[clamp(18px,2.4vw,28px)]">
              <div className="inline-flex items-center gap-2 text-xs text-ink-3 uppercase tracking-[0.12em]">
                <span className="w-2 h-2 rounded-full bg-accent-a shadow-[0_0_12px_var(--color-accent-a)]" />
                Today&apos;s standup · {today}
              </div>
              <h1 className="text-[clamp(34px,5.4vw,64px)] leading-[1.04] tracking-[-0.035em] font-semibold mt-2 mb-3.5 text-balance">
                Talk for <span className="gradient-text">90 seconds.</span>
                <br />
                We&apos;ll do the rest.
              </h1>
              <ul className="grid gap-3 mt-5">
                {PROMPTS.map((p, i) => (
                  <li
                    key={i}
                    className="flex gap-3.5 items-center text-ink-2 p-3 px-3.5 border border-line rounded-[14px] bg-glass-bg"
                  >
                    <span className="font-mono text-xs text-accent-a border border-accent-a/50 bg-accent-a/10 rounded-md px-1.5 py-0.5">
                      0{i + 1}
                    </span>
                    <span className="text-sm">{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass rounded-[20px] p-[clamp(18px,2.4vw,28px)] flex flex-col gap-4.5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-[11px] tracking-[0.14em] uppercase text-ink-3 border border-line px-2.5 py-1.5 rounded-full bg-glass-bg">
                  <span className="w-2 h-2 rounded-full bg-ink-4" />
                  READY
                </span>
                <span className="font-mono text-[clamp(20px,2vw,28px)] tracking-[0.06em] text-ink tabular-nums">
                  00:00
                </span>
              </div>

              <div className="relative h-[clamp(140px,22vw,220px)] rounded-[14px] bg-gradient-to-b from-white/[0.03] to-white/[0.01] border border-line p-4.5 overflow-hidden wave-glow">
                <LiveWaveform />
              </div>

              <div className="flex items-center justify-between gap-3.5">
                <button disabled className="opacity-35 inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-line bg-glass-bg text-ink-2 text-[13px] font-medium">
                  Reset
                </button>
                <button
                  onClick={startCountdown}
                  className="relative w-[clamp(86px,10vw,110px)] aspect-square rounded-full p-0 border-0 cursor-pointer"
                >
                  <span className="absolute inset-0 rounded-full rec-btn-ring animate-spin-slow" />
                  <span className="absolute inset-[5px] rounded-full rec-btn-core grid place-items-center text-white border border-line-2">
                    <Mic size={28} />
                  </span>
                </button>
                <button disabled className="opacity-35 inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-br from-accent-a to-accent-b text-[#0a0a14] text-[13px] font-semibold shadow-[0_12px_30px_-10px_rgba(167,139,250,0.6)]">
                  Send <ArrowRight size={14} />
                </button>
              </div>

              <div className="text-ink-3 text-xs flex gap-2 flex-wrap justify-center">
                <span>Tap to record</span>
                <span>·</span>
                <span>Auto-transcribed</span>
                <span>·</span>
                <span>Auto-summarized</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:col-span-2">
              <ChipStat label="Avg drop" value="62s" />
              <ChipStat label="On-time" value="94%" />
              <ChipStat label="Streak" value="12d" />
              <ChipStat label="Listens" value="328" />
            </div>
          </motion.div>
        )}

        {state === "countdown" && (
          <motion.div
            key="countdown"
            initial={{ opacity: 0, scale: 2.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: "spring", damping: 15 }}
            className="flex flex-col items-center gap-4 min-h-[60vh] justify-center"
          >
            <span className="text-9xl md:text-[10rem] font-bold gradient-text tabular-nums leading-none">
              {countdown}
            </span>
            <span className="text-ink-3 text-sm tracking-wider">Get ready...</span>
          </motion.div>
        )}

        {state === "recording" && (
          <motion.div
            key="recording"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass rounded-[20px] p-[clamp(18px,2.4vw,28px)] flex flex-col gap-4.5 max-w-2xl mx-auto w-full"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-[11px] tracking-[0.14em] uppercase text-[#FF6B6B] border border-[rgba(255,107,107,0.5)] px-2.5 py-1.5 rounded-full bg-glass-bg">
                <span className="w-2 h-2 rounded-full bg-[#FF6B6B] shadow-[0_0_0_0_rgba(255,107,107,0.6)] animate-[pulse_1.4s_ease-out_infinite]" />
                RECORDING
              </span>
              <span className="font-mono text-[clamp(20px,2vw,28px)] tracking-[0.06em] text-ink tabular-nums">
                {mm}:{ss}
              </span>
            </div>

            <div className="relative h-[clamp(140px,22vw,220px)] rounded-[14px] bg-gradient-to-b from-white/[0.03] to-white/[0.01] border border-line p-4.5 overflow-hidden wave-glow">
              <LiveWaveform />
            </div>

            <div className="flex items-center justify-between gap-3.5">
              <button onClick={() => { stopRecording(); reset(); }} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-line bg-glass-bg text-ink-2 text-[13px] font-medium hover:text-ink hover:border-line-2 transition-colors">
                Reset
              </button>
              <button
                onClick={stopRecording}
                className="relative w-[clamp(86px,10vw,110px)] aspect-square rounded-full p-0 border-0 cursor-pointer"
              >
                <span className="absolute inset-0 rounded-full rec-btn-ring animate-spin-fast" />
                <span className="absolute inset-[5px] rounded-full rec-btn-core-recording grid place-items-center text-white border border-line-2">
                  <Pause size={28} />
                </span>
              </button>
              <button disabled className="opacity-35 inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-br from-accent-a to-accent-b text-[#0a0a14] text-[13px] font-semibold">
                Send <ArrowRight size={14} />
              </button>
            </div>

            <div className="w-full bg-white/[0.04] rounded-full h-1 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent-a to-accent-c rounded-full transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
          </motion.div>
        )}

        {state === "preview" && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center gap-6 w-full max-w-md mx-auto min-h-[60vh] justify-center"
          >
            <h3 className="text-xl md:text-2xl font-semibold">Preview your drop</h3>

            <div className="w-full glass rounded-[20px] p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-accent-a animate-glow-pulse" />
                <span className="text-xs text-ink-3 font-mono tabular-nums">
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
                <p className="text-xs text-ink-3">
                  Audio captured. Tap &quot;Drop it&quot; to transcribe and
                  process.
                </p>
              )}
            </div>

            <div className="flex gap-3 w-full">
              <button
                onClick={reset}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-full border border-line text-ink-3 hover:text-ink hover:border-line-2 transition-all duration-200"
              >
                <RotateCcw size={16} />
                <span className="text-sm font-medium">Re-record</span>
              </button>
              <button
                onClick={processAndDrop}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-full bg-gradient-to-r from-accent-a to-accent-b text-[#0a0a14] font-semibold shadow-[0_12px_30px_-10px_rgba(167,139,250,0.6)] hover:-translate-y-0.5 transition-all duration-200"
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
            className="flex flex-col items-center gap-6 w-full max-w-md mx-auto min-h-[60vh] justify-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-a/15 to-accent-b/10 flex items-center justify-center border border-accent-a/10">
              <Loader2 size={28} className="text-accent-a animate-spin" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-1.5">
                Processing your drop
              </h3>
              <p className="text-sm text-ink-3">{processingStep}</p>
            </div>

            {processingError && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full glass rounded-[20px] p-4 !border-[#FF6B6B]/15 flex items-start gap-3"
              >
                <AlertCircle size={16} className="text-[#FF6B6B] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-[#FF6B6B] font-semibold mb-0.5">
                    Pipeline error
                  </p>
                  <p className="text-xs text-ink-3">{processingError}</p>
                  <button
                    onClick={reset}
                    className="text-xs text-accent-a hover:underline mt-2 font-medium"
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
                className="w-full glass rounded-[20px] p-5"
              >
                <p className="text-[10px] text-ink-4 mb-2 uppercase tracking-[0.2em] font-semibold">
                  Transcript
                </p>
                <p className="text-sm text-ink-2 leading-relaxed">
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
            className="text-center min-h-[60vh] flex flex-col items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", delay: 0.1, damping: 10 }}
              className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-accent-a/15 to-accent-a/5 flex items-center justify-center border border-accent-a/15"
            >
              <Mic size={40} className="text-accent-a" />
            </motion.div>
            <h3 className="text-2xl font-semibold gradient-text-accent mb-1">Drop saved.</h3>
            <p className="text-ink-3 text-sm mb-8">Go build.</p>

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
              className="text-sm text-ink-3 hover:text-accent-a transition-colors font-medium"
            >
              Record another
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
