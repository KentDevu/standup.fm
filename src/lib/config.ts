export const hasSupabase = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const hasDeepgram = typeof window === "undefined" && !!process.env.DEEPGRAM_API_KEY;
export const hasAnthropic = typeof window === "undefined" && !!process.env.ANTHROPIC_API_KEY;
export const hasElevenLabs = typeof window === "undefined" && !!process.env.ELEVENLABS_API_KEY;
