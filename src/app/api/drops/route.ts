import { NextRequest, NextResponse } from "next/server";
import { mockDrops } from "@/lib/mock-data";

function hasSupabaseConfig() {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function GET() {
  if (!hasSupabaseConfig()) {
    return NextResponse.json(mockDrops);
  }

  try {
    const { getSupabase } = await import("@/lib/supabase");
    const supabase = getSupabase();
    const { data: drops, error } = await supabase
      .from("drops")
      .select(`*, user:users(*), extractions(*)`)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error || !drops?.length) {
      return NextResponse.json(mockDrops);
    }

    return NextResponse.json(drops);
  } catch {
    return NextResponse.json(mockDrops);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!hasSupabaseConfig()) {
    return NextResponse.json({ id: `local-${Date.now()}`, ...body, fallback: true });
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
      return NextResponse.json({ id: `local-${Date.now()}`, ...body, fallback: true });
    }

    if (body.extractions?.length) {
      await supabase.from("extractions").insert(
        body.extractions.map(
          (e: { type: string; content: string; mentions: string[] }) => ({
            drop_id: drop.id,
            type: e.type,
            content: e.content,
            mentions: e.mentions || [],
          })
        )
      );
    }

    return NextResponse.json(drop);
  } catch {
    return NextResponse.json({ id: `local-${Date.now()}`, ...body, fallback: true });
  }
}
