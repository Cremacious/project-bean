// app/sign-up/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/auth-client";
import { SocialButtons } from "@/components/auth/social-buttons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BRAND } from "@/lib/brand";
import { BrandMark } from "@/components/brand-mark";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await signUp.email({ name, email, password });
    setLoading(false);
    if (error) {
      setError(error.message ?? "Could not create your account.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[var(--pc-sky)] p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-[0_20px_44px_-18px_rgba(22,40,58,0.4)] sm:p-8">
        <div className="mb-6 flex flex-col items-center gap-2.5 text-center">
          <BrandMark size="lg" />
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-[var(--pc-ink)]">
              {BRAND.name}
            </h1>
            <p className="text-sm font-semibold text-[var(--pc-sub)]">Create your account</p>
          </div>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="font-semibold text-[var(--pc-ink)]">Your name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-11 rounded-xl border-[var(--pc-line)] px-3.5 text-base focus-visible:border-[var(--pc-plum)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email" className="font-semibold text-[var(--pc-ink)]">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              autoComplete="new-password"
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
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-[var(--pc-line)]" />
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--pc-sub)]">or</span>
          <span className="h-px flex-1 bg-[var(--pc-line)]" />
        </div>
        <SocialButtons />

        <p className="mt-6 text-center text-sm text-[var(--pc-sub)]">
          Already have an account?{" "}
          <Link href="/sign-in" className="font-bold text-[var(--pc-plum)] underline-offset-2 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
