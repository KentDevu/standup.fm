export interface Team {
  id: string;
  name: string;
  digest_time: string;
  timezone: string;
}

export interface User {
  id: string;
  team_id: string;
  name: string;
  avatar_url: string | null;
  role: string;
  email: string;
}

export interface Drop {
  id: string;
  user_id: string;
  team_id: string;
  audio_url: string;
  duration: number;
  transcript: string | null;
  sentiment_score: number | null;
  created_at: string;
  user?: User;
  extractions?: Extraction[];
}

export type ExtractionType = "blocker" | "ask" | "win" | "decision";

export interface Extraction {
  id: string;
  drop_id: string;
  type: ExtractionType;
  content: string;
  mentions: string[];
  resolved_at: string | null;
  resolved_by: string | null;
}

export interface Reaction {
  id: string;
  drop_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface PulseMetrics {
  blocker_frequency: number[];
  resolution_time: number[];
  participation: number[];
  sentiment_trend: number[];
}

export interface AIInsight {
  message: string;
  severity: "info" | "warning" | "critical";
  user_name?: string;
}
