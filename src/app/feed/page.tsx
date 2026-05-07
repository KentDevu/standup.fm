"use client";

import { FeedView } from "@/components/feed/feed-view";
import { AppShell } from "@/components/layout/nav";

export default function FeedPage() {
  return (
    <AppShell>
      <FeedView />
    </AppShell>
  );
}
