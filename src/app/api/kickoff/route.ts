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
  const body = await req.json();

  const groqKey = process.env.GROQ_API_KEY;
  const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let briefingText = FALLBACK_BRIEFING.join(" ");
  let briefingItems = FALLBACK_BRIEFING;

  // Fetch drops server-side — more reliable than trusting client-passed data
  let drops = body.drops ?? [];
  if (!drops.length && supabaseUrl && supabaseKey) {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data } = await supabase
        .from("drops")
        .select("transcript, user:users(name)")
        .not("transcript", "is", null)
        .order("created_at", { ascending: false })
        .limit(10);
      drops = data ?? [];
      console.log(`[kickoff] fetched ${drops.length} drops from DB`);
    } catch (err) {
      console.error("[kickoff] DB fetch error:", err);
    }
  }

  console.log(`[kickoff] drops count: ${drops.length}, groqKey: ${!!groqKey}`);

  // Generate briefing with Groq (Llama 3.3 70B) if available
  const dropsWithTranscript = drops.filter((d: { transcript?: string }) =>
    d.transcript?.trim(),
  );
  if (groqKey && dropsWithTranscript.length) {
    try {
      const dropSummaries = dropsWithTranscript
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
            content: `You are a witty, warm team AI summarizing standup drops for someone returning from time off. Write 5-6 bullet points. Rules:
- Group updates by topic or theme, NOT by repeating names each time.
- Mention each person's name at most ONCE — weave it naturally into the sentence.
- After each bullet, add a short, genuine editorial comment (in parentheses) — like "(solid progress)", "(this might need your attention)", or "(love the momentum here)".
- Tone: clear, human, slightly playful — like a trusted colleague catching you up.
- Be concise. No filler phrases.

Standup drops:\n${dropSummaries}\n\nReturn ONLY valid JSON: { "items": ["bullet with (comment)", ...] }`,
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
      const ttsController = new AbortController();
      const ttsTimeout = setTimeout(() => ttsController.abort(), 30000);

      // Truncate text to ~1000 chars to stay within ElevenLabs free tier limits
      const ttsText = briefingText.slice(0, 1000);

      let ttsResponse: Response;
      try {
        ttsResponse = await fetch(
          "https://api.elevenlabs.io/v1/text-to-speech/Xb7hH8MSUJpSbSDYk0k2",
          {
            method: "POST",
            headers: {
              "xi-api-key": elevenLabsKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text: ttsText,
              model_id: "eleven_multilingual_v2",
              voice_settings: { stability: 0.5, similarity_boost: 0.75 },
            }),
            signal: ttsController.signal,
          },
        );
      } finally {
        clearTimeout(ttsTimeout);
      }

      if (ttsResponse.ok) {
        const audioBuffer = await ttsResponse.arrayBuffer();
        const base64 = Buffer.from(audioBuffer).toString("base64");
        audioUrl = `data:audio/mpeg;base64,${base64}`;
        console.log(
          `[kickoff] ElevenLabs audio generated — ${audioBuffer.byteLength}b`,
        );
      } else {
        const err = await ttsResponse.text().catch(() => "");
        console.error("[kickoff] ElevenLabs error:", ttsResponse.status, err);
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        console.error("[kickoff] ElevenLabs timed out after 30s");
      } else {
        console.error("[kickoff] ElevenLabs exception:", err);
      }
    }
  }

  return NextResponse.json({
    items: briefingItems,
    audio_url: audioUrl,
    fallback: !groqKey,
  });
}
