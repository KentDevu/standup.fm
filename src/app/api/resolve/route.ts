import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { extraction_id, user_id } = await req.json();

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ resolved: true, fallback: true });
  }

  try {
    const { getSupabase } = await import("@/lib/supabase");
    const supabase = getSupabase();

    const { error } = await supabase
      .from("extractions")
      .update({
        resolved_at: new Date().toISOString(),
        resolved_by: user_id || "00000000-0000-0000-0000-000000000011",
      })
      .eq("id", extraction_id);

    if (error) {
      return NextResponse.json({ resolved: true, fallback: true });
    }

    return NextResponse.json({ resolved: true });
  } catch {
    return NextResponse.json({ resolved: true, fallback: true });
  }
}
