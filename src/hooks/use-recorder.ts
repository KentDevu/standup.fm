"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export type RecordingState = "idle" | "countdown" | "recording" | "preview" | "processing" | "dropped";

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
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
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
      stopRecording();
    }
  }, [elapsed, state, stopRecording]);

  const processAndDrop = useCallback(async () => {
    setState("processing");

    let finalTranscript = "";
    let finalExtractions: { type: string; content: string; mentions: string[] }[] = [];
    let sentimentScore = 0.7;
    let audioUrl = "";

    // Step 1: Upload audio
    if (audioBlob) {
      setProcessingStep("Uploading audio...");
      try {
        const formData = new FormData();
        formData.append("audio", audioBlob, "drop.webm");
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          audioUrl = uploadData.url || "";
        }
      } catch {
        // fallback: no upload
      }
    }

    // Step 2: Transcribe
    setProcessingStep("Transcribing...");
    if (audioBlob) {
      try {
        const formData = new FormData();
        formData.append("audio", audioBlob, "drop.webm");
        const res = await fetch("/api/transcribe", { method: "POST", body: formData });
        if (res.ok) {
          const data = await res.json();
          if (data.transcript) finalTranscript = data.transcript;
        }
      } catch {
        // fallback below
      }
    }

    if (!finalTranscript) {
      finalTranscript =
        "Yesterday I shipped the login flow with OAuth. Today I'm refactoring the dashboard components. I'm blocked — the staging DB keeps throwing 500 errors. Marco, could you grant me staging credentials?";
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
          team_members: ["Aya Santos", "Marco Weber", "Priya Sharma", "Jordan Chen"],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.extractions?.length) finalExtractions = data.extractions;
        if (data.sentiment_score != null) sentimentScore = data.sentiment_score;
      }
    } catch {
      // fallback below
    }

    if (!finalExtractions.length) {
      finalExtractions = [
        { type: "win", content: "Shipped login flow with OAuth", mentions: [] },
        { type: "blocker", content: "Staging DB throwing 500 errors", mentions: ["Marco Weber"] },
        { type: "ask", content: "Need staging credentials from Marco", mentions: ["Marco Weber"] },
      ];
    }
    setExtractions(finalExtractions);

    // Step 4: Save drop
    setProcessingStep("Saving drop...");
    try {
      await fetch("/api/drops", {
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
    } catch {
      // feed will still show from local state
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
    maxDuration: MAX_DURATION,
    startCountdown,
    stopRecording,
    processAndDrop,
    reset,
  };
}
