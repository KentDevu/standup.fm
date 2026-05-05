import { NextRequest, NextResponse } from "next/server";

const FALLBACK_TRANSCRIPT =
  "Yesterday I shipped the login flow with OAuth — feels good to finally have that done. Today I'm refactoring the dashboard components. I'm blocked though — the staging DB keeps throwing 500 errors and I need infra access. Marco, if you could grant me those staging credentials, that would unblock me.";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const audio = formData.get("audio") as Blob;

  if (!audio) {
    return NextResponse.json({ error: "No audio provided" }, { status: 400 });
  }

  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      transcript: FALLBACK_TRANSCRIPT,
      fallback: true,
    });
  }

  try {
    const buffer = Buffer.from(await audio.arrayBuffer());

    const response = await fetch(
      "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&detect_language=true",
      {
        method: "POST",
        headers: {
          Authorization: `Token ${apiKey}`,
          "Content-Type": "audio/webm",
        },
        body: buffer,
      },
    );

    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      console.error("[transcribe] Deepgram error:", response.status, errBody);
      return NextResponse.json({
        transcript: FALLBACK_TRANSCRIPT,
        fallback: true,
      });
    }

    const data = await response.json();
    const transcript =
      data.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";

    return NextResponse.json({
      transcript: transcript || FALLBACK_TRANSCRIPT,
      fallback: !transcript,
    });
  } catch (err) {
    console.error("[transcribe] exception:", err);
    return NextResponse.json({
      transcript: FALLBACK_TRANSCRIPT,
      fallback: true,
    });
  }
}
