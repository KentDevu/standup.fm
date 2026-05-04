import { NextResponse } from "next/server";
import { mockPulseMetrics, mockInsights } from "@/lib/mock-data";

export async function GET() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({
      metrics: mockPulseMetrics,
      insights: mockInsights,
      fallback: true,
    });
  }

  try {
    const { getSupabase } = await import("@/lib/supabase");
    const supabase = getSupabase();

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const { data: extractions } = await supabase
      .from("extractions")
      .select("*, drop:drops(created_at, sentiment_score, user:users(name))")
      .gte("created_at", weekAgo.toISOString());

    if (!extractions?.length) {
      return NextResponse.json({
        metrics: mockPulseMetrics,
        insights: mockInsights,
        fallback: true,
      });
    }

    const blockersByDay = Array(7).fill(0);
    const resolutionTimes: number[] = [];

    for (const ext of extractions) {
      if (ext.type === "blocker") {
        const day = new Date(ext.created_at).getDay();
        blockersByDay[day]++;
        if (ext.resolved_at) {
          const hours =
            (new Date(ext.resolved_at).getTime() - new Date(ext.created_at).getTime()) /
            (1000 * 60 * 60);
          resolutionTimes.push(hours);
        }
      }
    }

    const { data: drops } = await supabase
      .from("drops")
      .select("created_at, sentiment_score, user_id")
      .gte("created_at", weekAgo.toISOString());

    const { data: users } = await supabase
      .from("users")
      .select("id")
      .limit(50);

    const totalUsers = users?.length || 4;
    const participationByDay = Array(7).fill(0);
    const sentimentByDay = Array(7).fill(0);
    const countByDay = Array(7).fill(0);
    const uniqueUsersByDay: Set<string>[] = Array.from({ length: 7 }, () => new Set());

    for (const drop of drops || []) {
      const day = new Date(drop.created_at).getDay();
      uniqueUsersByDay[day].add(drop.user_id);
      if (drop.sentiment_score != null) {
        sentimentByDay[day] += drop.sentiment_score;
        countByDay[day]++;
      }
    }

    for (let i = 0; i < 7; i++) {
      participationByDay[i] = Math.round((uniqueUsersByDay[i].size / totalUsers) * 100);
      sentimentByDay[i] = countByDay[i] ? sentimentByDay[i] / countByDay[i] : 0.7;
    }

    const avgResolution =
      resolutionTimes.length
        ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
        : 4.0;

    const unresolvedByUser: Record<string, number> = {};
    for (const ext of extractions) {
      if (ext.type === "blocker" && !ext.resolved_at && ext.drop?.user?.name) {
        const name = ext.drop.user.name;
        unresolvedByUser[name] = (unresolvedByUser[name] || 0) + 1;
      }
    }

    const insights = [];
    for (const [name, count] of Object.entries(unresolvedByUser)) {
      if (count >= 2) {
        insights.push({
          message: `${name} has raised ${count} unresolved blockers this week. Worth a check-in?`,
          severity: "warning" as const,
          user_name: name,
        });
      }
    }

    const latestSentiment = sentimentByDay.filter((s) => s > 0);
    if (latestSentiment.length >= 2) {
      const trend = latestSentiment[latestSentiment.length - 1] - latestSentiment[0];
      if (trend > 0.05) {
        insights.push({
          message: `Team sentiment is trending up ${Math.round(trend * 100)}% this week.`,
          severity: "info" as const,
        });
      }
    }

    if (insights.length === 0) {
      insights.push(...mockInsights);
    }

    return NextResponse.json({
      metrics: {
        blocker_frequency: blockersByDay,
        resolution_time: Array(7).fill(avgResolution),
        participation: participationByDay,
        sentiment_trend: sentimentByDay,
      },
      insights,
      fallback: false,
    });
  } catch {
    return NextResponse.json({
      metrics: mockPulseMetrics,
      insights: mockInsights,
      fallback: true,
    });
  }
}
