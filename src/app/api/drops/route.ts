import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const supabase = getSupabase();
  const { data: drops, error } = await supabase
    .from("drops")
    .select(
      `
      *,
      user:users(*),
      extractions(*)
    `
    )
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(drops);
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  const body = await req.json();

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
    return NextResponse.json({ error: error.message }, { status: 500 });
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
}
