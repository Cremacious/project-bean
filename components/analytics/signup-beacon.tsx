// components/analytics/signup-beacon.tsx
"use client";

// Fires signup_completed for SOCIAL (OAuth) sign ups (issue #38).
//
// Social login is a redirect flow, so unlike the email form there is no single
// place in code that knows "an account was just created". BetterAuth solves the
// new-vs-returning distinction for us: only first-time users are redirected to
// the `newUserCallbackURL` we set in SocialButtons, which carries a `signup_new`
// marker naming the provider. This beacon, mounted globally in the root layout,
// reads that marker on the landing page, fires the event once, and strips the
// marker so a refresh or shared link cannot refire it or leak it.
//
// The marker is the provider name only ("google" / "apple"); no personal data is
// involved, and track() sanitizes params regardless. When analytics is disabled
// track() no-ops, so this is harmless in every environment (it still tidies the
// URL, which is desirable either way).
import { useEffect } from "react";
import { track } from "@/lib/analytics";

const MARKER = "signup_new";
const ALLOWED_METHODS = new Set(["google", "apple"]);

export function SignupBeacon() {
  useEffect(() => {
    const url = new URL(window.location.href);
    const method = url.searchParams.get(MARKER);
    if (!method) return;

    if (ALLOWED_METHODS.has(method)) {
      track("signup_completed", { method });
    }

    // Remove the marker from the URL (stripping it before any refire is possible
    // also acts as the one-shot guard, including under React strict mode).
    url.searchParams.delete(MARKER);
    window.history.replaceState(null, "", url.toString());
  }, []);

  return null;
}
