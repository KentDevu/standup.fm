import { NextResponse } from "next/server";
import { mockPulseMetrics, mockInsights } from "@/lib/mock-data";

export async function GET() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
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
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    // Fetch drops + extractions in parallel
    const [dropsResult, extractionsResult, usersResult] = await Promise.all([
      supabase
        .from("drops")
        .select("created_at, sentiment_score, user_id")
        .gte("created_at", weekAgo.toISOString()),
      supabase
        .from("extractions")
        .select(
          "type, created_at, resolved_at, drop:drops(created_at, user:users(name))",
        )
        .gte("created_at", weekAgo.toISOString()),
      supabase.from("users").select("id").limit(50),
    ]);

    const drops = dropsResult.data ?? [];
    const extractions = extractionsResult.data ?? [];
    const totalUsers = usersResult.data?.length || 4;

    // No data at all → use mock
    if (!drops.length && !extractions.length) {
      return NextResponse.json({
        metrics: mockPulseMetrics,
        insights: mockInsights,
        fallback: true,
      });
    }

    // Build last-7-days slots ordered chronologically (index 0 = 6 days ago, index 6 = today)
    const dayKeys: string[] = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().slice(0, 10); // "YYYY-MM-DD"
    });

    const slotIndex = (isoTimestamp: string) => {
      const dateKey = isoTimestamp.slice(0, 10);
      return dayKeys.indexOf(dateKey); // -1 if older than 7 days
    };

    const blockersByDay = Array(7).fill(0);
    const resolutionByDay: number[][] = Array.from({ length: 7 }, () => []);
    const sentimentByDay: number[] = Array(7).fill(0);
    const countByDay: number[] = Array(7).fill(0);
    const uniqueUsersByDay: Set<string>[] = Array.from(
      { length: 7 },
      () => new Set(),
    );

    for (const ext of extractions) {
      const i = slotIndex(ext.created_at);
      if (i < 0) continue;
      if (ext.type === "blocker") {
        blockersByDay[i]++;
        if (ext.resolved_at) {
          const hours =
            (new Date(ext.resolved_at).getTime() -
              new Date(ext.created_at).getTime()) /
            (1000 * 60 * 60);
          resolutionByDay[i].push(hours);
        }
      }
    }

    for (const drop of drops) {
      const i = slotIndex(drop.created_at);
      if (i < 0) continue;
      uniqueUsersByDay[i].add(drop.user_id);
      if (drop.sentiment_score != null) {
        sentimentByDay[i] += drop.sentiment_score;
        countByDay[i]++;
      }
    }

    // Participation % per day
    const participationByDay = Array.from({ length: 7 }, (_, i) =>
      Math.round((uniqueUsersByDay[i].size / totalUsers) * 100),
    );

    // Sentiment per day — days with no data inherit last known value
    const sentimentTrend = Array(7).fill(0);
    let lastSentiment = 0.65;
    for (let i = 0; i < 7; i++) {
      sentimentTrend[i] = countByDay[i]
        ? sentimentByDay[i] / countByDay[i]
        : lastSentiment;
      if (countByDay[i]) lastSentiment = sentimentTrend[i];
    }

    // Resolution time per day — days with no data use overall avg
    const allResolutionTimes = resolutionByDay.flat();
    const globalAvg = allResolutionTimes.length
      ? allResolutionTimes.reduce((a, b) => a + b, 0) /
        allResolutionTimes.length
      : 4.0;
    const resolutionTimeline = resolutionByDay.map((times) =>
      times.length
        ? times.reduce((a, b) => a + b, 0) / times.length
        : globalAvg,
    );

    // Today stats — slot 6 is always today
    const todayDrops = drops.filter((d) => slotIndex(d.created_at) === 6);
    const activeMembersToday = new Set(todayDrops.map((d) => d.user_id)).size;
    const openBlockers = extractions.filter(
      (e) => e.type === "blocker" && !e.resolved_at,
    ).length;

    // AI insights from real data
    const insights: {
      message: string;
      severity: "info" | "warning" | "critical";
      user_name?: string;
    }[] = [];

    const unresolvedByUser: Record<string, number> = {};
    for (const ext of extractions) {
      if (ext.type === "blocker" && !ext.resolved_at) {
        const drop = ext.drop as unknown as {
          user?: { name: string } | { name: string }[];
        };
        const name = Array.isArray(drop?.user)
          ? drop.user[0]?.name
          : drop?.user?.name;
        if (name) unresolvedByUser[name] = (unresolvedByUser[name] || 0) + 1;
      }
    }

    for (const [name, count] of Object.entries(unresolvedByUser)) {
      if (count >= 2) {
        insights.push({
          message: `${name} has ${count} unresolved blockers this week — worth a check-in.`,
          severity: "warning",
          user_name: name,
        });
      }
    }

    const sentimentStart = sentimentTrend.find((s) => s > 0) ?? 0;
    const sentimentEnd = sentimentTrend[6];
    const sentimentDelta = sentimentEnd - sentimentStart;
    if (Math.abs(sentimentDelta) > 0.05) {
      insights.push({
        message:
          sentimentDelta > 0
            ? `Team sentiment is up ${Math.round(sentimentDelta * 100)}% this week. 🎉`
            : `Team sentiment dipped ${Math.round(Math.abs(sentimentDelta) * 100)}% this week — check in with the team.`,
        severity: sentimentDelta > 0 ? "info" : "warning",
      });
    }

    if (todayDrops.length === 0) {
      insights.push({
        message:
          "No standups recorded today yet. Remind the team to drop in! 🎙️",
        severity: "info",
      });
    } else if (activeMembersToday >= totalUsers) {
      insights.push({
        message: `Full team participation today — everyone dropped in. 🙌`,
        severity: "info",
      });
    }

    if (insights.length === 0) insights.push(...mockInsights.slice(0, 1));

    return NextResponse.json({
      metrics: {
        blocker_frequency: blockersByDay,
        resolution_time: resolutionTimeline,
        participation: participationByDay,
        sentiment_trend: sentimentTrend,
      },
      stats: {
        drops_today: todayDrops.length,
        active_members_today: activeMembersToday,
        total_users: totalUsers,
        open_blockers: openBlockers,
        total_drops_week: drops.length,
      },
      day_labels: dayKeys.map((k) => {
        const d = new Date(k + "T12:00:00Z");
        return d.toLocaleDateString("en-US", { weekday: "short" }); // "Mon", "Tue"…
      }),
      insights,
      fallback: false,
    });
  } catch (err) {
    console.error("[pulse] exception:", err);
    return NextResponse.json({
      metrics: mockPulseMetrics,
      insights: mockInsights,
      fallback: true,
    });
  }
}
