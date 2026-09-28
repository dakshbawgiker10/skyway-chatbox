"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Login failed.");
      const next = searchParams.get("next") || "/";
      router.replace(next.startsWith("/") ? next : "/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="relative mx-auto max-w-md pt-8 sm:pt-14">
      {/* Background Ambient Radial Glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-600/25 blur-3xl animate-pulse-slow" />

      <div className="relative overflow-hidden rounded-3xl border border-purple-500/25 bg-obsidian-900/80 p-7 shadow-2xl backdrop-blur-2xl sm:p-9">
        {/* Top ambient highlight line */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent" />

        <div className="flex items-center justify-between">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-violet-600 text-white shadow-purple-glow-sm">
            <LockKeyhole className="h-6 w-6" />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center">
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full border border-obsidian-900 bg-emerald-400" />
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/25 bg-purple-500/10 px-2.5 py-1 text-[11px] font-semibold text-purple-300">
            <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />
            Authorized Portal
          </span>
        </div>

        <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
          SkyWay Operations Access
        </h1>
        <p className="mt-2 text-xs leading-relaxed text-slate-400 sm:text-sm">
          Enter the authorized operations PIN to access the airport RAG assistant and SOP knowledge base.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Operations PIN / Password
            </label>
            <div className="mt-1.5 flex items-center gap-2.5 rounded-2xl border border-purple-500/25 bg-obsidian-950/80 px-3.5 py-1 transition-all duration-200 focus-within:border-purple-400/80 focus-within:shadow-purple-glow">
              <KeyRound className="h-4 w-4 shrink-0 text-purple-400" />
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent py-2.5 text-sm text-white placeholder:text-slate-500 outline-none"
                placeholder="Enter authorized access PIN…"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-purple-300 transition"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/30 px-3.5 py-2.5 text-xs text-red-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={pending || !password}
            className="group mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-purple-glow transition-all duration-200 hover:scale-[1.02] hover:shadow-purple-glow-lg active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>Unlock Workspace</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 border-t border-purple-500/10 pt-4 text-center">
          <p className="text-[11px] text-slate-500">
            Protected internal system · Groq LLaMA 3.3 70B &amp; Pinecone Vector Store
          </p>
        </div>
      </div>
    </div>
  );
}
