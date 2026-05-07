"use client";

import { Recorder } from "@/components/drop/recorder";
import { AppShell } from "@/components/layout/nav";

export default function HomePage() {
  return (
    <AppShell>
      <Recorder />
    </AppShell>
  );
}
