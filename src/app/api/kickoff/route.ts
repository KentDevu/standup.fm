import { NextRequest, NextResponse } from "next/server";

const FALLBACK_BRIEFING = [
  "While you were away, the team shipped 3 features and resolved 5 blockers.",
  "Marco deployed the caching layer — API latency is down 40%. The webhook integration is next.",
  "Aya is blocked on staging DB access. She mentioned you specifically — credentials are needed.",
  "Priya finalized the Q3 roadmap. Sprint demo moved to Friday for timezone overlap with Sydney.",
  "Jordan completed the Kubernetes migration with zero downtime. SSL certs expire in 3 days — needs sign-off.",
  "Team sentiment is up 8% this week. No critical unresolved items blocking your work directly.",
];

export async function POST(req: NextRequest) {
  const { drops } = await req.json();

  const groqKey = process.env.GROQ_API_KEY;
  const elevenLabsKey = process.env.ELEVENLABS_API_KEY;

  let briefingText = FALLBACK_BRIEFING.join(" ");
  let briefingItems = FALLBACK_BRIEFING;

  // Generate briefing with Groq (Llama 3.3 70B) if available
  if (groqKey && drops?.length) {
    try {
      const dropSummaries = drops
        .map(
          (d: { user?: { name: string }; transcript: string }) =>
            `${d.user?.name || "Someone"}: ${d.transcript}`,
        )
        .join("\n\n");

      const Groq = (await import("groq-sdk")).default;
      const groq = new Groq({ apiKey: groqKey });

      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
        max_tokens: 1024,
        messages: [
          {
            role: "system",
            content:
              "You are generating catch-up briefings for team members returning from PTO. Return valid JSON only.",
          },
          {
            role: "user",
            content: `Based on these team standup drops, write 5-6 bullet points summarizing what they missed. Focus on: blockers that mention them, key decisions, wins, and anything urgent. Be concise and friendly.\n\nDrops:\n${dropSummaries}\n\nReturn ONLY a JSON object: { "items": ["bullet point 1", "bullet point 2", ...] }`,
          },
        ],
      });

      const text = completion.choices[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed.items) && parsed.items.length) {
        briefingItems = parsed.items;
        briefingText = briefingItems.join(" ");
      }
    } catch (err) {
      console.error("[kickoff] Groq exception:", err);
      // use fallback
    }
  }

  let audioUrl: string | null = null;

  // Generate audio with ElevenLabs if available
  if (elevenLabsKey) {
    try {
      const response = await fetch(
        "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM",
        {
          method: "POST",
          headers: {
            "xi-api-key": elevenLabsKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: briefingText,
            model_id: "eleven_monolingual_v1",
            voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          }),
        },
      );

      if (response.ok) {
        const audioBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(audioBuffer).toString("base64");
        audioUrl = `data:audio/mpeg;base64,${base64}`;
      }
    } catch {
      // no audio, text only
    }
  }

  return NextResponse.json({
    items: briefingItems,
    audio_url: audioUrl,
    fallback: !groqKey,
  });
}
