// lib/subscription-display.ts
//
// Turns a Subscription (the single #33 abstraction, lib/entitlements.ts) into the
// plain, dash-free copy the parent account page shows for issue #36. This is the
// ONE place status becomes words: whether the parent is on a free trial (with days
// left), on an active paid plan (monthly or yearly), needs to fix a payment, has a
// plan that is ending, or is not subscribed, plus the renewal or end date when we
// know it. Kept pure (no I/O, `now` injectable) so it unit tests without a DB.
//
// Copy note (UI rule 1): every user-facing string here is free of dashes.
import type { Subscription } from "./entitlements";
import { planNameForProductId } from "./plans";

/** Which color treatment the status block uses. Purely presentational. */
export type SubscriptionVariant = "active" | "trial" | "attention" | "none";

export type SubscriptionDisplay = {
  /** Whether premium is unlocked for this parent right now (mirrors #33 isActive). */
  isActive: boolean;
  /** Short status heading, dash free. e.g. "Free trial", "Premium yearly", "Not subscribed". */
  title: string;
  /** One plain sentence explaining the status, including a date when known. */
  detail: string;
  /** Plan display name if the product id is known ("Monthly" / "Yearly"), else null. */
  planName: string | null;
  /** Whole days left in a trial, or null when not on a trial (or no known end). */
  trialDaysLeft: number | null;
  /** The renewal or end date, formatted, or null when unknown. */
  renewalDate: string | null;
  /** Point the parent at the plans/paywall (they are not entitled). */
  showUpgrade: boolean;
  /** Show the manage/cancel (app store) guidance (they are entitled). */
  showManage: boolean;
  /** Color treatment for the status block. */
  variant: SubscriptionVariant;
};

// A fixed locale so the server render and any test read the same string.
const DATE_FMT = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

/** Format a date as "March 5, 2026" (no dashes). */
export function formatDate(date: Date): string {
  return DATE_FMT.format(date);
}

/** Whole days from `now` until `end`, rounded up; 0 if already past; null if no end. */
export function daysUntil(end: Date | null, now: Date): number | null {
  if (!end) return null;
  const ms = end.getTime() - now.getTime();
  if (ms <= 0) return 0;
  return Math.ceil(ms / 86_400_000);
}

/** "day" vs "days". Note: no dash anywhere in the returned copy. */
function dayWord(n: number): string {
  return n === 1 ? "day" : "days";
}

/**
 * Describe a parent's subscription for the account page. Reads only the values on
 * the Subscription (which already came through the fail-safe #33 read), so a
 * billing outage that resolved to "not subscribed" simply shows the free state.
 */
export function describeSubscription(
  sub: Subscription,
  now: Date = new Date(),
): SubscriptionDisplay {
  const planName = planNameForProductId(sub.productId);
  const renewalDate = sub.currentPeriodEnd ? formatDate(sub.currentPeriodEnd) : null;

  // Not currently entitled: none, expired, or a trial/paid/canceled period that lapsed.
  if (!sub.isActive) {
    return {
      isActive: false,
      title: "Not subscribed",
      detail:
        "You are on the free library. Start a free trial anytime to unlock every bedtime story.",
      planName: null,
      trialDaysLeft: null,
      renewalDate: null,
      showUpgrade: true,
      showManage: false,
      variant: "none",
    };
  }

  // On a free trial. Lead with how much time is left.
  if (sub.status === "trialing") {
    const left = daysUntil(sub.currentPeriodEnd, now);
    let detail: string;
    if (left != null) {
      detail = `You have ${left} ${dayWord(left)} left in your free trial.`;
      if (renewalDate) detail += ` It becomes a paid plan on ${renewalDate}.`;
    } else {
      detail = "Your free trial is active.";
    }
    return {
      isActive: true,
      title: "Free trial",
      detail,
      planName,
      trialDaysLeft: left,
      renewalDate,
      showUpgrade: false,
      showManage: true,
      variant: "trial",
    };
  }

  // Entitled, but the last payment failed. Still on, for now.
  if (sub.status === "grace") {
    return {
      isActive: true,
      title: "Payment needed",
      detail:
        "There was a problem with your last payment. Update your billing in the app store to keep every story unlocked.",
      planName,
      trialDaysLeft: null,
      renewalDate,
      showUpgrade: false,
      showManage: true,
      variant: "attention",
    };
  }

  // Auto renew is off, but the already paid time is still running.
  if (sub.status === "canceled") {
    return {
      isActive: true,
      title: "Premium ending",
      detail: renewalDate
        ? `Your premium stays on until ${renewalDate} and will not renew after that.`
        : "Your premium is on for now and will not renew.",
      planName,
      trialDaysLeft: null,
      renewalDate,
      showUpgrade: false,
      showManage: true,
      variant: "attention",
    };
  }

  // An active paid plan (monthly or yearly), or an internal comp grant.
  return {
    isActive: true,
    title: planName ? `Premium ${planName.toLowerCase()}` : "Premium",
    detail: renewalDate
      ? `Your subscription renews on ${renewalDate}.`
      : "Your subscription is active.",
    planName,
    trialDaysLeft: null,
    renewalDate,
    showUpgrade: false,
    showManage: true,
    variant: "active",
  };
}
