"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plane } from "lucide-react";

const links = [
  { href: "/", label: "AI Chatbox" },
  { href: "/admin", label: "Upload Context (admin only)" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#010103] text-slate-100 selection:bg-purple-500/30 selection:text-white">
      {/* Glossy Purple Ambient Lighting */}
      <div className="pointer-events-none fixed left-1/2 top-0 -z-10 h-80 w-full max-w-5xl -translate-x-1/2 rounded-full bg-gradient-to-b from-purple-600/12 via-violet-900/5 to-transparent blur-3xl" />

      {/* Taskbar / Navigation */}
      <header className="sticky top-0 z-30 w-full border-b border-purple-500/15 bg-[#07050d]/80 backdrop-blur-2xl">
        <div className="flex w-full items-center justify-between px-5 py-3 sm:px-8">
          {/* Logo Space: ONLY logo and company name, nothing more or less */}
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-violet-600 text-white shadow-[0_0_16px_rgba(168,85,247,0.35)]">
              <Plane className="h-5 w-5" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight text-white">
              Skyway Chatbox
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-2 rounded-2xl border border-purple-500/20 bg-black/60 p-1 shadow-inner backdrop-blur-xl">
            {links.map(({ href, label }) => {
              const active =
                href === "/"
                  ? pathname === "/" || pathname === "/chat"
                  : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200 sm:text-sm ${
                    active
                      ? "bg-gradient-to-r from-purple-600 via-purple-700 to-violet-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.35)] border border-purple-400/40"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main 16:9 Canvas Frame */}
      <main className="flex min-h-0 w-full flex-1 flex-col px-4 py-4 sm:px-8 sm:py-6">
        {children}
      </main>
    </div>
  );
}
