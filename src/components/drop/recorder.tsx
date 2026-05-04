"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, Square, RotateCcw, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LiveWaveform } from "@/components/ui/waveform";

type RecordingState = "idle" | "countdown" | "recording" | "preview";

const PROMPTS = ["Yesterday", "Today", "Blockers", "Asks"];
const MAX_DURATION = 90;

export function Recorder() {
  const [state, setState] = useState<RecordingState>("idle");
  const [countdown, setCountdown] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [processing, setProcessing] = useState(false);
  const [dropped, setDropped] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startCountdown = useCallback(() => {
    setState("countdown");
    setCountdown(3);
    let c = 3;
    const interval = setInterval(() => {
      c--;
      if (c === 0) {
        clearInterval(interval);
        startRecording();
      } else {
        setCountdown(c);
      }
    }, 1000);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setState("recording");
      setElapsed(0);

      timerRef.current = setInterval(() => {
        setElapsed((prev) => {
          if (prev >= MAX_DURATION - 1) {
            stopRecording();
            return MAX_DURATION;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      setState("idle");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setState("preview");
    setProcessing(true);
    setTimeout(() => {
      setTranscript(
        "Yesterday I shipped the login flow with OAuth. Today I'm refactoring the dashboard components. I'm blocked — the staging DB keeps throwing 500 errors and I need infra access. Marco, could you grant me staging credentials?"
      );
      setProcessing(false);
    }, 2000);
  }, []);

  const handleDrop = useCallback(() => {
    setDropped(true);
    setTimeout(() => {
      setState("idle");
      setDropped(false);
      setTranscript("");
      setElapsed(0);
    }, 2000);
  }, []);

  const handleReRecord = useCallback(() => {
    setTranscript("");
    setState("idle");
    setElapsed(0);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const progress = (elapsed / MAX_DURATION) * 100;

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

            <p className="text-cream-dim text-sm">
              Tap to drop your standup
            </p>
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
            {dropped ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center"
              >
                <div className="text-4xl mb-3">🎙️</div>
                <h3 className="text-xl font-semibold text-mint">
                  Drop saved.
                </h3>
                <p className="text-cream-dim text-sm mt-1">Go build.</p>
              </motion.div>
            ) : (
              <>
                <h3 className="text-lg font-semibold">Preview your drop</h3>

                <div className="w-full bg-midnight-light rounded-xl p-4 border border-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-coral" />
                    <span className="text-xs text-cream-dim font-mono">
                      {elapsed}s recorded
                    </span>
                  </div>

                  {processing ? (
                    <div className="space-y-2">
                      <div className="h-3 bg-white/5 rounded animate-pulse w-full" />
                      <div className="h-3 bg-white/5 rounded animate-pulse w-4/5" />
                      <div className="h-3 bg-white/5 rounded animate-pulse w-3/5" />
                      <p className="text-xs text-cream-dim mt-3">
                        Transcribing...
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-cream/80 leading-relaxed">
                      {transcript}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 w-full">
                  <button
                    onClick={handleReRecord}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 text-cream-dim hover:text-cream hover:border-white/20 transition-colors"
                  >
                    <RotateCcw size={16} />
                    <span className="text-sm font-medium">Re-record</span>
                  </button>
                  <button
                    onClick={handleDrop}
                    disabled={processing}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-coral text-white font-medium hover:bg-coral-dark transition-colors disabled:opacity-50"
                  >
                    <Send size={16} />
                    <span className="text-sm">Drop it</span>
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
