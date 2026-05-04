"use client";

import { PulseView } from "@/components/pulse/pulse-view";
import { TopBar, BottomNav } from "@/components/layout/nav";

export default function PulsePage() {
  return (
    <>
      <TopBar />
      <main>
        <PulseView />
      </main>
      <BottomNav />
    </>
  );
}
