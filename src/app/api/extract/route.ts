import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export async function POST(req: NextRequest) {
  const { transcript, team_members } = await req.json();

  if (!transcript) {
    return NextResponse.json(
      { error: "No transcript provided" },
      { status: 400 }
    );
  }

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

  try {
    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch?.[0] || "{}");
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json(
      { error: "Failed to parse extraction" },
      { status: 500 }
    );
  }
}
