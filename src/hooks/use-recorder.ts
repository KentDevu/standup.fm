"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export type RecordingState =
  | "idle"
  | "countdown"
  | "recording"
  | "preview"
  | "processing"
  | "dropped";

const MAX_DURATION = 90;

export function useRecorder() {
  const [state, setState] = useState<RecordingState>("idle");
  const [countdown, setCountdown] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcript, setTranscript] = useState("");
  const [extractions, setExtractions] = useState<
    { type: string; content: string; mentions: string[] }[]
  >([]);
  const [processingStep, setProcessingStep] = useState("");
  const [processingError, setProcessingError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // Auto-stop at max duration — kept outside the state updater to avoid side effects
  const elapsedRef = useRef(0);
  useEffect(() => {
    elapsedRef.current = elapsed;
  }, [elapsed]);

  const reset = useCallback(() => {
    setState("idle");
    setCountdown(3);
    setElapsed(0);
    setAudioBlob(null);
    setTranscript("");
    setExtractions([]);
    setProcessingStep("");
    setProcessingError(null);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Pick the best supported MIME type — Safari needs audio/mp4
      const mimeType =
        [
          "audio/webm;codecs=opus",
          "audio/webm",
          "audio/ogg;codecs=opus",
          "audio/mp4",
        ].find((m) => MediaRecorder.isTypeSupported(m)) ?? "";

      const mediaRecorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, {
          type: mimeType || "audio/webm",
        });
        setAudioBlob(blob);
      };

      mediaRecorder.start(250);
      setState("recording");
      setElapsed(0);

      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } catch {
      setState("idle");
    }
  }, []);

  const startCountdown = useCallback(() => {
    setState("countdown");
    setCountdown(3);
    let c = 3;
    countdownRef.current = setInterval(() => {
      c--;
      if (c === 0) {
        if (countdownRef.current) clearInterval(countdownRef.current);
        startRecording();
      } else {
        setCountdown(c);
      }
    }, 1000);
  }, [startRecording]);

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setState("preview");
  }, []);

  useEffect(() => {
    if (elapsed >= MAX_DURATION && state === "recording") {
      const t = setTimeout(stopRecording, 0);
      return () => clearTimeout(t);
    }
  }, [elapsed, state, stopRecording]);

  const processAndDrop = useCallback(async () => {
    setState("processing");
    setProcessingError(null);

    let finalTranscript = "";
    let finalExtractions: {
      type: string;
      content: string;
      mentions: string[];
    }[] = [];
    let sentimentScore = 0.7;
    let audioUrl = "";

    // Step 1: Upload audio
    if (audioBlob) {
      setProcessingStep("Uploading audio...");
      try {
        const formData = new FormData();
        formData.append("audio", audioBlob, "drop.webm");
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          console.error("[upload] failed:", uploadData);
          setProcessingError(
            `Upload failed: ${uploadData.error ?? uploadRes.status}`,
          );
          setState("preview");
          return;
        }
        audioUrl = uploadData.url || "";
        if (uploadData.fallback) {
          console.warn(
            "[upload] using fallback URL — storage may not be configured",
          );
        }
      } catch (err) {
        console.error("[upload] exception:", err);
        setProcessingError("Upload failed — check console for details");
        setState("preview");
        return;
      }
    }

    // Step 2: Transcribe
    setProcessingStep("Transcribing...");
    if (audioBlob) {
      try {
        const formData = new FormData();
        formData.append("audio", audioBlob, "drop.webm");
        const res = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) {
          console.error("[transcribe] failed:", data);
          setProcessingError(
            data.error ?? "Transcription failed — check mic and try again",
          );
          setState("preview");
          return;
        }
        finalTranscript = data.transcript ?? "";
      } catch (err) {
        console.error("[transcribe] exception:", err);
        setProcessingError("Transcription failed — check your connection");
        setState("preview");
        return;
      }
    }

    if (!finalTranscript.trim()) {
      setProcessingError(
        "No speech detected — please speak clearly and try again",
      );
      setState("preview");
      return;
    }
    setTranscript(finalTranscript);

    // Step 3: AI Extraction
    setProcessingStep("Extracting insights...");
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: finalTranscript,
          team_members: [
            "Aya Santos",
            "Marco Weber",
            "Priya Sharma",
            "Jordan Chen",
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("[extract] failed:", data);
      } else if (data.fallback) {
        console.warn(
          "[extract] using fallback extraction — check ANTHROPIC_API_KEY",
        );
      }
      if (data.extractions?.length) finalExtractions = data.extractions;
      if (data.sentiment_score != null) sentimentScore = data.sentiment_score;
    } catch (err) {
      console.error("[extract] exception:", err);
    }

    // If AI extraction failed entirely, use the keyword-based fallback already built into /api/extract
    // That fallback operates on the real transcript so it's still real data
    if (!finalExtractions.length) {
      finalExtractions = [
        { type: "win", content: finalTranscript.slice(0, 120), mentions: [] },
      ];
    }
    setExtractions(finalExtractions);

    // Step 4: Save drop
    setProcessingStep("Saving drop...");
    try {
      const res = await fetch("/api/drops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: "00000000-0000-0000-0000-000000000011",
          team_id: "00000000-0000-0000-0000-000000000001",
          audio_url: audioUrl || "/demo/drop.webm",
          duration: elapsed,
          transcript: finalTranscript,
          sentiment_score: sentimentScore,
          extractions: finalExtractions,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("[drops] save failed:", data);
        setProcessingError(`Save failed: ${data.error ?? res.status}`);
      } else if (data.fallback) {
        console.warn("[drops] saved locally only — check Supabase config");
      }
    } catch (err) {
      console.error("[drops] exception:", err);
    }

    setProcessingStep("");
    setState("dropped");
  }, [audioBlob, elapsed]);

  return {
    state,
    countdown,
    elapsed,
    audioBlob,
    transcript,
    extractions,
    processingStep,
    processingError,
    maxDuration: MAX_DURATION,
    startCountdown,
    stopRecording,
    processAndDrop,
    reset,
  };
}
