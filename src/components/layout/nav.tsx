"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mic, LayoutList, Activity, Headphones } from "lucide-react";

const links = [
  { href: "/", icon: Mic, label: "Drop" },
  { href: "/feed", icon: LayoutList, label: "Feed" },
  { href: "/pulse", icon: Activity, label: "Pulse" },
  { href: "/kickoff", icon: Headphones, label: "Kickoff" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-midnight-light/95 backdrop-blur-lg border-t border-white/5 z-50">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16">
        {links.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 px-4 py-2 transition-colors ${
                active ? "text-coral" : "text-cream-dim hover:text-cream"
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium uppercase tracking-wider">
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
    <header className="fixed top-0 left-0 right-0 bg-midnight/95 backdrop-blur-lg border-b border-white/5 z-50">
      <div className="max-w-lg mx-auto flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-coral rounded-lg flex items-center justify-center">
            <Mic size={16} className="text-white" />
          </div>
          <span className="font-semibold text-cream tracking-tight">
            StandUp<span className="text-coral">.fm</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-midnight-lighter rounded-full flex items-center justify-center text-xs font-medium text-cream">
            AS
          </div>
        </div>
      </div>
    </header>
  );
}
