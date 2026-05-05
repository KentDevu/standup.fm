import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const audio = formData.get("audio") as File | null;

  if (!audio) {
    return NextResponse.json({ error: "No audio provided" }, { status: 400 });
  }

  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    console.error("[transcribe] DEEPGRAM_API_KEY not set");
    return NextResponse.json(
      { error: "Transcription service not configured" },
      { status: 503 },
    );
  }

  try {
    const buffer = Buffer.from(await audio.arrayBuffer());
    // Use the FULL content type (including codec) for Deepgram — it needs this to decode opus streams
    // Only Supabase storage needs the stripped base type
    const deepgramContentType = audio.type || "audio/webm;codecs=opus";
    // Strip for logging clarity
    const baseType = deepgramContentType.split(";")[0].trim();

    console.log(
      `[transcribe] sending to Deepgram — size: ${buffer.byteLength}b, type: ${deepgramContentType}`,
    );

    if (buffer.byteLength < 1000) {
      console.warn(
        "[transcribe] audio buffer suspiciously small — may be empty",
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    let response: Response;
    try {
      response = await fetch(
        "https://api.deepgram.com/v1/listen?model=nova-2&punctuate=true&language=en",
        {
          method: "POST",
          headers: {
            Authorization: `Token ${apiKey}`,
            "Content-Type": deepgramContentType,
          },
          body: buffer,
          signal: controller.signal,
        },
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      console.error("[transcribe] Deepgram error:", response.status, errBody);
      return NextResponse.json(
        { error: `Deepgram error ${response.status}` },
        { status: 502 },
      );
    }

    const data = await response.json();
    const duration = data.metadata?.duration ?? 0;
    const transcript =
      data.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? "";

    console.log(
      `[transcribe] Deepgram response — duration: ${duration}s, transcript length: ${transcript.length}`,
    );

    if (!transcript) {
      if (duration === 0) {
        console.warn(
          "[transcribe] Deepgram saw 0s audio — buffer may be malformed",
        );
        return NextResponse.json(
          { error: "Recording appears empty — please try again" },
          { status: 422 },
        );
      }
      console.warn(
        "[transcribe] Deepgram returned empty transcript:",
        JSON.stringify(data.results),
      );
      return NextResponse.json(
        { error: "No speech detected — speak clearly and try again" },
        { status: 422 },
      );
    }

    return NextResponse.json({ transcript });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      console.error("[transcribe] Deepgram request timed out after 15s");
      return NextResponse.json(
        { error: "Transcription timed out — try a shorter recording" },
        { status: 504 },
      );
    }
    console.error("[transcribe] exception:", err);
    return NextResponse.json(
      { error: "Transcription failed" },
      { status: 500 },
    );
  }
}
