import { NextRequest, NextResponse } from "next/server";

// Seed user — same as recorder
const DEMO_USER_ID = "00000000-0000-0000-0000-000000000011";

export async function POST(req: NextRequest) {
  const { drop_id, emoji, user_id = DEMO_USER_ID } = await req.json();

  if (!drop_id || !emoji) {
    return NextResponse.json(
      { error: "drop_id and emoji required" },
      { status: 400 },
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 },
    );
  }

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Check if the reaction already exists (toggle off)
  const { data: existing } = await supabase
    .from("reactions")
    .select("id")
    .eq("drop_id", drop_id)
    .eq("user_id", user_id)
    .eq("emoji", emoji)
    .maybeSingle();

  if (existing) {
    // Toggle off — remove the reaction
    const { error } = await supabase
      .from("reactions")
      .delete()
      .eq("id", existing.id);
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ action: "removed" });
  }

  // Add the reaction
  const { data, error } = await supabase
    .from("reactions")
    .insert({ drop_id, user_id, emoji })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ action: "added", reaction: data });
}
