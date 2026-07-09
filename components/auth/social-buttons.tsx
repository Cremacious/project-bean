// components/auth/social-buttons.tsx
"use client";
import { signIn } from "@/lib/auth-client";

export function SocialButtons() {
  const go = (provider: "google" | "apple") =>
    signIn.social({ provider, callbackURL: "/" });
  return (
    <div className="flex flex-col gap-2.5">
      <button onClick={() => go("google")} className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--pc-line)] bg-white py-2.5 font-display font-bold text-[var(--pc-ink)] shadow-[0_3px_0_var(--pc-line)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5">Continue with Google</button>
      <button onClick={() => go("apple")} className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--pc-line)] bg-white py-2.5 font-display font-bold text-[var(--pc-ink)] shadow-[0_3px_0_var(--pc-line)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5">Continue with Apple</button>
    </div>
  );
}
