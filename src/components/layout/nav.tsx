"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Mic,
  Rss,
  Activity,
  CheckSquare,
  Search,
  Bell,
} from "lucide-react";

const links = [
  { href: "/", icon: Mic, label: "Drop" },
  { href: "/feed", icon: Rss, label: "Feed" },
  { href: "/pulse", icon: Activity, label: "Pulse" },
  { href: "/kickoff", icon: CheckSquare, label: "Kickoff" },
];

export function TopBar() {
  return (
    <header className="relative z-[5] flex items-center gap-3 px-[clamp(14px,3vw,28px)] py-3.5">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex gap-[3px]" aria-hidden="true">
          <span className="w-1.5 h-4 rounded-[3px] bg-accent-a block" />
          <span className="w-1.5 h-[22px] rounded-[3px] bg-accent-c block" />
          <span className="w-1.5 h-3 rounded-[3px] bg-accent-b block" />
        </span>
        <span className="font-bold tracking-tight text-[17px]">
          standup<span className="text-ink-3 font-medium">.fm</span>
        </span>
      </div>

      <div className="flex-1" />

      <div className="hidden md:inline-flex items-center gap-2 px-3 py-2 border border-line rounded-full bg-glass-bg text-ink-3 text-[13px] min-w-[240px]">
        <Search size={14} />
        <span>Search drops, people, tags</span>
        <kbd className="ml-auto text-[11px] text-ink-4 border border-line rounded px-1.5 py-0.5 font-sans">
          ⌘K
        </kbd>
      </div>

      <button className="relative inline-grid place-items-center w-9 h-9 rounded-xl border border-line bg-glass-bg text-ink-2 hover:text-ink hover:border-line-2 transition-colors">
        <Bell size={18} />
        <span className="absolute top-2 right-2 w-[7px] h-[7px] rounded-full bg-[#FF6B6B] shadow-[0_0_0_2px_var(--color-bg-0)]" />
      </button>

      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-a to-accent-c text-[#0a0a14] font-bold text-xs grid place-items-center tracking-wide">
        YA
      </div>
    </header>
  );
}

export function Dock() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed left-1/2 -translate-x-1/2 bottom-[clamp(14px,2.4vw,24px)] z-50 p-1.5 rounded-full bg-[rgba(15,15,25,0.55)] border border-line-2 backdrop-blur-[28px] backdrop-saturate-[160%] shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_30px_60px_-10px_rgba(0,0,0,0.6)] max-[720px]:left-3 max-[720px]:right-3 max-[720px]:bottom-3 max-[720px]:translate-x-0 max-[720px]:rounded-[22px]"
      aria-label="Primary"
    >
      <div className="flex items-center gap-0.5 max-[720px]:justify-between max-[720px]:gap-0">
        {links.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`relative inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-medium transition-all duration-200 max-[720px]:flex-1 max-[720px]:flex-col max-[720px]:gap-0.5 max-[720px]:px-1.5 max-[720px]:py-2 max-[720px]:rounded-2xl max-[720px]:text-[11px] ${
                active ? "text-ink" : "text-ink-3 hover:text-ink"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <span className="inline-grid place-items-center">
                <Icon size={20} />
              </span>
              <span>{label}</span>
              {active && (
                <span
                  className="absolute inset-0 rounded-full max-[720px]:rounded-2xl -z-10 bg-gradient-to-br from-accent-a/[0.28] to-accent-b/[0.28] border border-accent-a/50 shadow-[0_8px_30px_-8px_rgba(167,139,250,0.55)]"
                  aria-hidden="true"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopBar />
      <main className="relative z-[2] px-[clamp(14px,3vw,28px)] pb-[clamp(150px,16vw,180px)] grid gap-4">
        {children}
      </main>
      <Dock />
    </>
  );
}
