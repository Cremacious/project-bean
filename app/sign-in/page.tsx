// app/sign-in/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInAction } from "@/lib/auth-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignInPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signInAction(username, password);
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? "Could not sign in.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--pc-sky)] p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-[0_20px_44px_-18px_rgba(22,40,58,0.4)] sm:p-8">
        <div className="mb-6 flex flex-col items-center gap-2.5">
          <span className="relative h-9 w-9 -rotate-6 rounded-xl" style={{ background: "var(--pc-poppy)" }}>
            <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full" style={{ background: "var(--pc-sun)" }} />
          </span>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-[var(--pc-ink)]">Storytime</h1>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="username" className="font-semibold text-[var(--pc-ink)]">Username</Label>
            <Input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="h-11 rounded-xl border-[var(--pc-line)] px-3.5 text-base focus-visible:border-[var(--pc-plum)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="font-semibold text-[var(--pc-ink)]">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-11 rounded-xl border-[var(--pc-line)] px-3.5 text-base focus-visible:border-[var(--pc-plum)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            />
          </div>
          {error && <p className="text-sm font-semibold text-[var(--pc-poppy-ink)]">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[var(--pc-plum)] py-3 font-display font-bold text-white shadow-[0_5px_0_var(--pc-plum-ink)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
