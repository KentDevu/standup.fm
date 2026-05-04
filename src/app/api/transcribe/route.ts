import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const audio = formData.get("audio") as Blob;

  if (!audio) {
    return NextResponse.json({ error: "No audio provided" }, { status: 400 });
  }

  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Deepgram API key not configured" },
      { status: 500 }
    );
  }

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
    }
  );

  if (!response.ok) {
    return NextResponse.json(
      { error: "Transcription failed" },
      { status: 500 }
    );
  }

  const data = await response.json();
  const transcript =
    data.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";

  return NextResponse.json({ transcript });
}
