"use client";

import { FeedView } from "@/components/feed/feed-view";
import { TopBar, BottomNav } from "@/components/layout/nav";

export default function FeedPage() {
  return (
    <>
      <TopBar />
      <main>
        <FeedView />
      </main>
      <BottomNav />
    </>
  );
}
