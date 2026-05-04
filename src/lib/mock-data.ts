import { Drop, User, Extraction, PulseMetrics, AIInsight } from "@/types";

export const mockUsers: User[] = [
  {
    id: "u1",
    team_id: "t1",
    name: "Aya Santos",
    avatar_url: null,
    role: "Frontend Lead",
    email: "aya@standup.fm",
  },
  {
    id: "u2",
    team_id: "t1",
    name: "Marco Weber",
    avatar_url: null,
    role: "Backend Engineer",
    email: "marco@standup.fm",
  },
  {
    id: "u3",
    team_id: "t1",
    name: "Priya Sharma",
    avatar_url: null,
    role: "Product Manager",
    email: "priya@standup.fm",
  },
  {
    id: "u4",
    team_id: "t1",
    name: "Jordan Chen",
    avatar_url: null,
    role: "DevOps",
    email: "jordan@standup.fm",
  },
];

export const mockExtractions: Extraction[] = [
  {
    id: "e1",
    drop_id: "d1",
    type: "win",
    content: "Shipped the login flow with OAuth",
    mentions: [],
    resolved_at: null,
    resolved_by: null,
  },
  {
    id: "e2",
    drop_id: "d1",
    type: "blocker",
    content: "Staging DB throwing 500 errors, need infra access",
    mentions: ["Marco Weber"],
    resolved_at: null,
    resolved_by: null,
  },
  {
    id: "e3",
    drop_id: "d1",
    type: "ask",
    content: "Need @Marco to grant staging DB credentials",
    mentions: ["Marco Weber"],
    resolved_at: null,
    resolved_by: null,
  },
  {
    id: "e4",
    drop_id: "d2",
    type: "win",
    content: "API latency down 40% after caching layer",
    mentions: [],
    resolved_at: null,
    resolved_by: null,
  },
  {
    id: "e5",
    drop_id: "d2",
    type: "blocker",
    content: "CI pipeline failing on integration tests",
    mentions: ["Jordan Chen"],
    resolved_at: "2026-05-03T14:00:00Z",
    resolved_by: "u4",
  },
  {
    id: "e6",
    drop_id: "d3",
    type: "ask",
    content: "Need design review on the new dashboard mockups",
    mentions: ["Aya Santos"],
    resolved_at: null,
    resolved_by: null,
  },
  {
    id: "e7",
    drop_id: "d3",
    type: "decision",
    content: "Moving sprint demo to Friday to accommodate timezone overlap",
    mentions: [],
    resolved_at: null,
    resolved_by: null,
  },
  {
    id: "e8",
    drop_id: "d4",
    type: "win",
    content: "Kubernetes cluster migration completed successfully",
    mentions: [],
    resolved_at: null,
    resolved_by: null,
  },
  {
    id: "e9",
    drop_id: "d4",
    type: "blocker",
    content: "SSL certs expiring in 3 days, need approval to renew",
    mentions: ["Priya Sharma"],
    resolved_at: null,
    resolved_by: null,
  },
];

export const mockDrops: Drop[] = [
  {
    id: "d1",
    user_id: "u1",
    team_id: "t1",
    audio_url: "/demo/aya-drop.webm",
    duration: 47,
    transcript:
      "Yesterday I shipped the login flow with OAuth — feels good to finally have that done. Today I'm refactoring the dashboard components. I'm blocked though — the staging DB keeps throwing 500 errors and I need infra access. Marco, if you could grant me those staging credentials, that'd unblock me.",
    sentiment_score: 0.6,
    created_at: "2026-05-04T01:30:00Z",
    user: mockUsers[0],
    extractions: mockExtractions.filter((e) => e.drop_id === "d1"),
  },
  {
    id: "d2",
    user_id: "u2",
    team_id: "t1",
    audio_url: "/demo/marco-drop.webm",
    duration: 52,
    transcript:
      "Hey team! Yesterday was a big one — got the caching layer deployed and API latency is down about 40 percent, which is huge. Today I'm tackling the webhook integration. One blocker — the CI pipeline is failing on integration tests, Jordan do you know if something changed in the test environment? I think it might be a Docker image version mismatch.",
    sentiment_score: 0.8,
    created_at: "2026-05-04T07:15:00Z",
    user: mockUsers[1],
    extractions: mockExtractions.filter((e) => e.drop_id === "d2"),
  },
  {
    id: "d3",
    user_id: "u3",
    team_id: "t1",
    audio_url: "/demo/priya-drop.webm",
    duration: 38,
    transcript:
      "Quick update — I finalized the Q3 roadmap with stakeholders yesterday. Today I'm writing the spec for the notification system. Aya, when you get a chance, I need your eyes on the new dashboard mockups. Also, the team agreed to move the sprint demo to Friday so we get better timezone overlap with the Sydney office.",
    sentiment_score: 0.7,
    created_at: "2026-05-04T03:45:00Z",
    user: mockUsers[2],
    extractions: mockExtractions.filter((e) => e.drop_id === "d3"),
  },
  {
    id: "d4",
    user_id: "u4",
    team_id: "t1",
    audio_url: "/demo/jordan-drop.webm",
    duration: 44,
    transcript:
      "Good morning. Yesterday I finished the Kubernetes cluster migration — all services are running on the new cluster now with zero downtime, which I'm pretty proud of. Today I'm setting up monitoring dashboards for the new infra. One thing — our SSL certificates are expiring in three days and I need Priya's sign-off to kick off the renewal process.",
    sentiment_score: 0.85,
    created_at: "2026-05-04T08:00:00Z",
    user: mockUsers[3],
    extractions: mockExtractions.filter((e) => e.drop_id === "d4"),
  },
];

export const mockPulseMetrics: PulseMetrics = {
  blocker_frequency: [2, 3, 1, 4, 2, 3, 2],
  resolution_time: [4.2, 3.8, 6.1, 2.5, 5.0, 3.2, 4.1],
  participation: [100, 75, 100, 100, 75, 100, 100],
  sentiment_trend: [0.7, 0.65, 0.72, 0.68, 0.75, 0.8, 0.73],
};

export const mockInsights: AIInsight[] = [
  {
    message:
      "Aya has raised 3 unresolved blockers this week. Worth a check-in?",
    severity: "warning",
    user_name: "Aya Santos",
  },
  {
    message:
      "Team sentiment is trending up 8% this week. The caching win boosted morale.",
    severity: "info",
  },
];
