// lib/onboarding-local.ts
//
// Secondary, per-device record that the parent has finished or skipped the
// first-time tutorial (issue #73). The authoritative flag is the per-account
// `onboarding_completed_at` column; this local flag is a belt-and-suspenders
// fallback so the tour never re-flashes before the server round-trips, and still
// stays dismissed on this device in the brief window before the additive
// migration is applied (see docs/DATABASE.md section 1.4).
//
// Client only. Guarded so it is a no-op (and never throws) during server
// rendering or when storage is unavailable, e.g. private browsing.

const KEY = "bq_onboarding_done_v1";

export function markOnboardingDoneLocally(): void {
  try {
    window.localStorage.setItem(KEY, "1");
  } catch {
    // Storage blocked or unavailable: the per-account flag still covers us.
  }
}

export function isOnboardingDoneLocally(): boolean {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}
