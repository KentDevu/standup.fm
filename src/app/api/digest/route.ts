import { NextResponse } from "next/server";

function userName(drop: {
  user?: { name: string } | { name: string }[];
}): string {
  if (!drop.user) return "Someone";
  return Array.isArray(drop.user)
    ? (drop.user[0]?.name ?? "Someone")
    : drop.user.name;
}

export async function POST() {
  const resendKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.DIGEST_TO_EMAIL;
  const groqKey = process.env.GROQ_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!resendKey || !toEmail) {
    return NextResponse.json(
      { error: "RESEND_API_KEY and DIGEST_TO_EMAIL are required" },
      { status: 503 },
    );
  }

  // Fetch today's drops from Supabase
  let drops: {
    user?: { name: string } | { name: string }[];
    transcript: string | null;
  }[] = [];
  if (supabaseUrl && supabaseKey) {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(supabaseUrl, supabaseKey);
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data } = await supabase
        .from("drops")
        .select("transcript, user:users(name)")
        .gte("created_at", todayStart.toISOString())
        .not("transcript", "is", null)
        .order("created_at", { ascending: true });

      drops = data ?? [];
      console.log(`[digest] fetched ${drops.length} drops for today`);
    } catch (err) {
      console.error("[digest] DB fetch error:", err);
    }
  }

  // Build email body — Groq summary or plain list
  let summaryHtml = "";
  const dropsWithTranscript = drops.filter((d) => d.transcript?.trim());

  if (groqKey && dropsWithTranscript.length) {
    try {
      const Groq = (await import("groq-sdk")).default;
      const groq = new Groq({ apiKey: groqKey });

      const dropSummaries = dropsWithTranscript
        .map((d) => `${userName(d)}: ${d.transcript}`)
        .join("\n\n");

      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
        max_tokens: 1024,
        messages: [
          {
            role: "system",
            content:
              "You generate daily standup digest emails for async teams. Return valid JSON only.",
          },
          {
            role: "user",
            content: `Summarize today's standups into a daily digest email. Write 4-6 bullet points. Group by theme, not by person. Mention each name naturally at most once. Add a short editorial comment in parentheses after each point.\n\nDrops:\n${dropSummaries}\n\nReturn ONLY: { "subject": "short subject line", "bullets": ["bullet (comment)", ...], "closing": "one encouraging closing sentence" }`,
          },
        ],
      });

      const parsed = JSON.parse(
        completion.choices[0]?.message?.content ?? "{}",
      );

      if (Array.isArray(parsed.bullets) && parsed.bullets.length) {
        const bulletHtml = parsed.bullets
          .map((b: string) => `<li style="margin-bottom:8px;">${b}</li>`)
          .join("");

        summaryHtml = `
          <h2 style="color:#FF6B6B;font-size:16px;margin-bottom:12px;">Today's Highlights</h2>
          <ul style="padding-left:20px;color:#333;font-size:14px;line-height:1.6;">${bulletHtml}</ul>
          ${parsed.closing ? `<p style="color:#555;font-size:13px;font-style:italic;margin-top:16px;">${parsed.closing}</p>` : ""}
        `;
      }
    } catch (err) {
      console.error("[digest] Groq error:", err);
    }
  }

  // Fallback: plain transcript list
  if (!summaryHtml) {
    if (dropsWithTranscript.length) {
      const items = dropsWithTranscript
        .map(
          (d) =>
            `<li style="margin-bottom:8px;"><strong>${userName(d)}:</strong> ${d.transcript}</li>`,
        )
        .join("");
      summaryHtml = `
        <h2 style="color:#FF6B6B;font-size:16px;margin-bottom:12px;">Today's Standups</h2>
        <ul style="padding-left:20px;color:#333;font-size:14px;line-height:1.6;">${items}</ul>
      `;
    } else {
      summaryHtml = `<p style="color:#555;font-size:14px;">No drops recorded today. Remind the team to share their standup! 🎙️</p>`;
    }
  }

  const date = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Inter,system-ui,sans-serif;background:#f4f4f4;margin:0;padding:20px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:#0A0E27;padding:24px 28px;">
      <p style="color:#FF6B6B;font-size:12px;font-weight:600;letter-spacing:0.1em;margin:0 0 4px;">STANDUP.FM</p>
      <h1 style="color:#F7F7F2;font-size:20px;margin:0;">Daily Digest</h1>
      <p style="color:#B8B8B0;font-size:13px;margin:6px 0 0;">${date}</p>
    </div>
    <div style="padding:24px 28px;">
      ${summaryHtml}
      <div style="margin-top:24px;padding-top:16px;border-top:1px solid #eee;">
        <p style="color:#999;font-size:11px;margin:0;">
          ${dropsWithTranscript.length} standup${dropsWithTranscript.length !== 1 ? "s" : ""} today · Sent by StandUp.fm
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;

  // Send via Resend
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(resendKey);

    const subject =
      dropsWithTranscript.length > 0
        ? `StandUp.fm · ${date} digest (${dropsWithTranscript.length} drop${dropsWithTranscript.length !== 1 ? "s" : ""})`
        : `StandUp.fm · ${date} — no drops yet`;

    const { data, error } = await resend.emails.send({
      from: "StandUp.fm <onboarding@resend.dev>",
      to: toEmail,
      subject,
      html,
    });

    if (error) {
      console.error("[digest] Resend error:", error);
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    console.log(`[digest] sent to ${toEmail}, id: ${data?.id}`);
    return NextResponse.json({
      success: true,
      drops: dropsWithTranscript.length,
      email_id: data?.id,
    });
  } catch (err) {
    console.error("[digest] Resend exception:", err);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 },
    );
  }
}
