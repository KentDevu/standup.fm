"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Mic,
  LayoutList,
  Activity,
  Headphones,
  Radio,
} from "lucide-react";

const links = [
  { href: "/", icon: Mic, label: "Drop" },
  { href: "/feed", icon: LayoutList, label: "Feed" },
  { href: "/pulse", icon: Activity, label: "Pulse" },
  { href: "/kickoff", icon: Headphones, label: "Kickoff" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[240px] flex-col glass z-50 border-r border-white/[0.04]">
      <div className="flex items-center gap-3 px-6 h-[72px] border-b border-white/[0.04]">
        <div className="w-10 h-10 bg-gradient-to-br from-orange to-rose rounded-xl flex items-center justify-center shadow-lg shadow-orange/25">
          <Radio size={18} className="text-white" />
        </div>
        <div>
          <span className="text-lg font-bold tracking-tight block leading-tight">
            StandUp<span className="gradient-text-orange">.fm</span>
          </span>
          <span className="text-[10px] text-cream-dim font-medium tracking-wider uppercase">voice standups</span>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-1 px-3 py-5">
        <p className="text-[10px] text-cream-muted font-semibold uppercase tracking-widest px-4 mb-2">Navigation</p>
        {links.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                active
                  ? "bg-orange/10 text-cream border border-orange/15"
                  : "text-cream-dim hover:text-cream hover:bg-white/[0.03] border border-transparent"
              }`}
            >
              <Icon
                size={18}
                className={active ? "text-orange" : "group-hover:text-orange/60 transition-colors"}
              />
              <span>{label}</span>
              {active && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-orange shadow-sm shadow-orange/50" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-5 border-t border-white/[0.04]">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-gradient-to-br from-orange to-gold rounded-full flex items-center justify-center text-xs font-bold text-ember shadow-lg shadow-orange/20 ring-2 ring-orange/20">
            AS
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-cream truncate">
              Aya Santos
            </p>
            <p className="text-[11px] text-cream-dim truncate">Engineering Lead</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass z-50 lg:hidden">
      <div className="max-w-lg mx-auto flex items-center justify-around h-[68px] px-2">
        {links.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1.5 px-4 py-2 rounded-xl transition-all duration-200 ${
                active
                  ? "text-orange"
                  : "text-cream-dim hover:text-cream"
              }`}
            >
              <div className="relative">
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                {active && (
                  <div className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-orange shadow-sm shadow-orange/50" />
                )}
              </div>
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${active ? "text-orange" : ""}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function TopBar() {
  return (
    <header className="fixed top-0 left-0 right-0 glass z-50 lg:hidden">
      <div className="max-w-5xl mx-auto flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-orange to-rose rounded-lg flex items-center justify-center shadow-lg shadow-orange/20">
            <Radio size={14} className="text-white" />
          </div>
          <span className="font-bold text-cream tracking-tight">
            StandUp<span className="gradient-text-orange">.fm</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-orange to-gold rounded-full flex items-center justify-center text-[10px] font-bold text-ember shadow-lg shadow-orange/20">
            AS
          </div>
        </div>
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sidebar />
      <TopBar />
      <main className="pt-14 pb-20 lg:pt-0 lg:pb-0 lg:pl-[240px] min-h-dvh">
        {children}
      </main>
      <BottomNav />
    </>
  );
}
