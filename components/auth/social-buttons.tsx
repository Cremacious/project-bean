// components/auth/social-buttons.tsx
"use client";
import { signIn } from "@/lib/auth-client";

// The same Google/Apple buttons serve both sign in and sign up. Neither flow is
// gated: signing in an existing parent never needed a gate, and account creation
// is not one of the store's gate-required actions (purchases and account
// settings still run the parental gate elsewhere).
export function SocialButtons() {
  const go = async (provider: "google" | "apple") => {
    // Analytics (issue #38): a social login silently creates an account for a
    // first-time user. BetterAuth sends only those NEW users to newUserCallbackURL
    // (returning users go to callbackURL), so the `signup_new` marker lands solely
    // on genuine sign ups. The SignupBeacon on the target page reads it and fires
    // signup_completed. The marker is the provider name only, never anything
    // personal, and the beacon strips it from the URL right after.
    signIn.social({
      provider,
      callbackURL: "/",
      newUserCallbackURL: `/?signup_new=${provider}`,
    });
  };

  return (
    <div className="flex flex-col gap-2.5">
      <button onClick={() => go("google")} className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--pc-line)] bg-white py-2.5 font-display font-bold text-[var(--pc-ink)] shadow-[0_3px_0_var(--pc-line)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5">Continue with Google</button>
      <button onClick={() => go("apple")} className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--pc-line)] bg-white py-2.5 font-display font-bold text-[var(--pc-ink)] shadow-[0_3px_0_var(--pc-line)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5">Continue with Apple</button>
    </div>
  );
}
