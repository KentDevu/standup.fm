"use client";

import { KickoffView } from "@/components/kickoff/kickoff-view";
import { TopBar, BottomNav } from "@/components/layout/nav";

export default function KickoffPage() {
  return (
    <>
      <TopBar />
      <main>
        <KickoffView />
      </main>
      <BottomNav />
    </>
  );
}
