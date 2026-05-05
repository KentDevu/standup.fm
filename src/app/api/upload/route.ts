import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const audio = formData.get("audio") as Blob;

  if (!audio) {
    return NextResponse.json({ error: "No audio provided" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Prefer service role key server-side (bypasses storage RLS); fall back to anon key
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ url: "/demo/drop.webm", fallback: true });
  }

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(supabaseUrl, supabaseKey);

  const filename = `drops/${Date.now()}-${Math.random().toString(36).slice(2)}.webm`;
  const buffer = Buffer.from(await audio.arrayBuffer());

  const { error } = await supabase.storage
    .from("audio")
    .upload(filename, buffer, {
      contentType: "audio/webm",
      upsert: false,
    });

  if (error) {
    return NextResponse.json({ url: "/demo/drop.webm", fallback: true });
  }

  const { data: urlData } = supabase.storage
    .from("audio")
    .getPublicUrl(filename);

  return NextResponse.json({ url: urlData.publicUrl });
}
