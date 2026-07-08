// components/auth/social-buttons.tsx
"use client";
import { signIn } from "@/lib/auth-client";

export function SocialButtons() {
  const go = (provider: "google" | "apple") =>
    signIn.social({ provider, callbackURL: "/" });
  return (
    <div className="flex flex-col gap-2.5">
      <button onClick={() => go("google")} className="flex items-center justify-center gap-2 rounded-xl border border-[var(--pc-line)] bg-white py-2.5 font-display font-bold text-[var(--pc-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]">Continue with Google</button>
      <button onClick={() => go("apple")} className="flex items-center justify-center gap-2 rounded-xl border border-[var(--pc-line)] bg-white py-2.5 font-display font-bold text-[var(--pc-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]">Continue with Apple</button>
    </div>
  );
}
