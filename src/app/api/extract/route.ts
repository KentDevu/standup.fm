import { NextRequest, NextResponse } from "next/server";

function fallbackExtraction(transcript: string) {
  const lower = transcript.toLowerCase();
  const extractions: { type: string; content: string; mentions: string[] }[] =
    [];

  const blockerPatterns = [
    /block(?:ed|er|ing)/i,
    /stuck/i,
    /can't/i,
    /500/i,
    /error/i,
    /failing/i,
    /broken/i,
  ];
  const askPatterns = [
    /need/i,
    /could you/i,
    /can you/i,
    /help/i,
    /review/i,
    /grant/i,
    /access/i,
  ];
  const winPatterns = [
    /shipped/i,
    /completed/i,
    /finished/i,
    /launched/i,
    /deployed/i,
    /done/i,
    /down \d+%/i,
  ];

  const sentences = transcript.split(/[.!?]+/).filter((s) => s.trim());
  const teamNames = [
    "Aya Santos",
    "Marco Weber",
    "Priya Sharma",
    "Jordan Chen",
  ];

  for (const sentence of sentences) {
    const mentioned = teamNames.filter(
      (name) =>
        sentence.toLowerCase().includes(name.toLowerCase()) ||
        sentence.toLowerCase().includes(name.split(" ")[0].toLowerCase()),
    );

    if (blockerPatterns.some((p) => p.test(sentence))) {
      extractions.push({
        type: "blocker",
        content: sentence.trim(),
        mentions: mentioned,
      });
    } else if (winPatterns.some((p) => p.test(sentence))) {
      extractions.push({
        type: "win",
        content: sentence.trim(),
        mentions: mentioned,
      });
    } else if (askPatterns.some((p) => p.test(sentence))) {
      extractions.push({
        type: "ask",
        content: sentence.trim(),
        mentions: mentioned,
      });
    }
  }

  if (extractions.length === 0) {
    extractions.push({
      type: "win",
      content: "Shared a standup update",
      mentions: [],
    });
  }

  const positiveWords = [
    "good",
    "great",
    "shipped",
    "done",
    "completed",
    "happy",
    "proud",
    "excited",
  ];
  const negativeWords = [
    "blocked",
    "stuck",
    "frustrated",
    "broken",
    "failing",
    "tired",
    "stressed",
  ];
  const posCount = positiveWords.filter((w) => lower.includes(w)).length;
  const negCount = negativeWords.filter((w) => lower.includes(w)).length;
  const sentiment = Math.max(
    0.1,
    Math.min(0.95, 0.6 + posCount * 0.1 - negCount * 0.15),
  );

  return {
    extractions,
    sentiment_score: sentiment,
    summary: sentences[0]?.trim() || "Standup update",
  };
}

export async function POST(req: NextRequest) {
  const { transcript: rawTranscript, team_members } = await req.json();

  if (!rawTranscript) {
    return NextResponse.json(
      { error: "No transcript provided" },
      { status: 400 },
    );
  }

  const transcript = String(rawTranscript).slice(0, 3000);

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn("[extract] GROQ_API_KEY not set — using keyword fallback");
    return NextResponse.json({
      ...fallbackExtraction(transcript),
      fallback: true,
    });
  }

  const memberList = team_members?.length
    ? `Team members: ${team_members.join(", ")}`
    : "";

  try {
    const Groq = (await import("groq-sdk")).default;
    const groq = new Groq({ apiKey });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
      max_tokens: 1024,
      messages: [
        {
          role: "system",
          content:
            "You are a standup analysis assistant. Extract structured data from voice standup transcripts and return valid JSON only.",
        },
        {
          role: "user",
          content: `Extract structured data from this standup voice drop transcript. ${memberList}\n\nTranscript: "${transcript}"\n\nReturn ONLY valid JSON with this exact schema:\n{\n  "extractions": [\n    {\n      "type": "blocker" | "ask" | "win" | "decision",\n      "content": "brief description",\n      "mentions": ["teammate name if mentioned"]\n    }\n  ],\n  "sentiment_score": 0.0,\n  "summary": "one sentence summary"\n}\n\nsentiment_score: 0.0 = very negative, 1.0 = very positive`,
        },
      ],
    });

    const text = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(text);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("[extract] exception:", err);
    return NextResponse.json({
      ...fallbackExtraction(transcript),
      fallback: true,
    });
  }
}
