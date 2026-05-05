import { NextRequest, NextResponse } from "next/server";

function hasSupabaseConfig() {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export async function GET() {
  if (!hasSupabaseConfig()) {
    console.warn("[drops] Supabase not configured");
    return NextResponse.json([]);
  }

  try {
    const { getSupabase } = await import("@/lib/supabase");
    const supabase = getSupabase();
    const { data: drops, error } = await supabase
      .from("drops")
      .select(`*, user:users(*), extractions(*), reactions(*)`)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("[drops] Supabase query error:", error);
      return NextResponse.json([]);
    }

    return NextResponse.json(drops ?? []);
  } catch (err) {
    console.error("[drops] GET exception:", err);
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!hasSupabaseConfig()) {
    return NextResponse.json({
      id: `local-${Date.now()}`,
      ...body,
      fallback: true,
    });
  }

  try {
    const { getSupabase } = await import("@/lib/supabase");
    const supabase = getSupabase();

    const { data: drop, error } = await supabase
      .from("drops")
      .insert({
        user_id: body.user_id,
        team_id: body.team_id,
        audio_url: body.audio_url,
        duration: body.duration,
        transcript: body.transcript,
        sentiment_score: body.sentiment_score,
      })
      .select()
      .single();

    if (error) {
      console.error("[drops] Supabase insert error:", error);
      return NextResponse.json({
        id: `local-${Date.now()}`,
        ...body,
        fallback: true,
      });
    }

    if (body.extractions?.length) {
      await supabase.from("extractions").insert(
        body.extractions.map(
          (e: { type: string; content: string; mentions: string[] }) => ({
            drop_id: drop.id,
            type: e.type,
            content: e.content,
            mentions: e.mentions || [],
          }),
        ),
      );
    }

    return NextResponse.json(drop);
  } catch {
    return NextResponse.json({
      id: `local-${Date.now()}`,
      ...body,
      fallback: true,
    });
  }
}
