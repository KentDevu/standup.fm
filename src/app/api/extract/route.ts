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

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      ...fallbackExtraction(transcript),
      fallback: true,
    });
  }

  try {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const anthropic = new Anthropic({ apiKey });

    const memberList = team_members?.length
      ? `Team members: ${team_members.join(", ")}`
      : "";

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Extract structured data from this standup voice drop transcript. ${memberList}

Transcript: "${transcript}"

Return ONLY valid JSON with this exact schema:
{
  "extractions": [
    {
      "type": "blocker" | "ask" | "win" | "decision",
      "content": "brief description",
      "mentions": ["teammate name if mentioned"]
    }
  ],
  "sentiment_score": 0.0-1.0 (0=very negative, 1=very positive),
  "summary": "one sentence summary"
}`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch?.[0] || "{}");
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("[extract] exception:", err);
    return NextResponse.json({
      ...fallbackExtraction(transcript),
      fallback: true,
    });
  }
}
