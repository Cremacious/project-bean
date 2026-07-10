// lib/plans.ts
//
// The single source of truth for the subscription plans we offer (issue #35):
// what they cost, the free trial length, and the savings math the plan-selection
// UI displays. Kept pure and dependency-free so it can be unit tested and shared
// by both the web plan picker today and the native purchase flow (#55) later.
//
// Billing approach (issue #33, option c): the web app does NOT sell subscriptions
// today. Purchasing happens in the native app (milestone M6, wired in #55) through
// RevenueCat, which reports the purchase back to us via the webhook. The
// `productId` on each plan is the RevenueCat product identifier the App Store /
// Play Store products must be configured with, so a purchase maps to the same
// "premium" entitlement the app already reads through lib/entitlements.ts.
//
// Copy note (UI rule 1): every user-facing string here is free of dashes.

export type PlanKey = "monthly" | "yearly";

export type Plan = {
  key: PlanKey;
  /** Display name, e.g. "Yearly". */
  name: string;
  /** RevenueCat product identifier configured in the stores (#55). */
  productId: string;
  /** Price in whole cents to avoid floating point drift. */
  priceCents: number;
  /** Billing period, used to phrase copy. */
  period: "month" | "year";
  /** Plainly worded billing cadence, e.g. "billed yearly". No dashes. */
  cadence: string;
  /** Whether this plan is highlighted as the best value. */
  highlight: boolean;
};

/** Length of the free trial, stated plainly in copy as "7 day free trial". */
export const TRIAL_DAYS = 7;

// RevenueCat product identifiers. These must match the products created in App
// Store Connect and Google Play and mapped to the "premium" entitlement in the
// RevenueCat dashboard (see .env.example).
export const PRODUCT_ID_MONTHLY = "bedtimequests_premium_monthly";
export const PRODUCT_ID_YEARLY = "bedtimequests_premium_yearly";

export const PLANS: Record<PlanKey, Plan> = {
  monthly: {
    key: "monthly",
    name: "Monthly",
    productId: PRODUCT_ID_MONTHLY,
    priceCents: 499,
    period: "month",
    cadence: "billed monthly",
    highlight: false,
  },
  yearly: {
    key: "yearly",
    name: "Yearly",
    productId: PRODUCT_ID_YEARLY,
    priceCents: 2999,
    period: "year",
    cadence: "billed yearly",
    highlight: true,
  },
};

/** All plans in display order (monthly first, yearly highlighted second). */
export const PLAN_LIST: Plan[] = [PLANS.monthly, PLANS.yearly];

/** Type guard for an untrusted plan key coming from a client or request. */
export function isPlanKey(value: unknown): value is PlanKey {
  return value === "monthly" || value === "yearly";
}

/** The plan for a key, or null if the key is not one we offer. */
export function getPlan(value: unknown): Plan | null {
  return isPlanKey(value) ? PLANS[value] : null;
}

/** Format whole cents as a US dollar string, e.g. 499 becomes "$4.99". */
export function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * What a year on the yearly plan saves versus paying monthly for twelve months,
 * plus the effective monthly cost. The monthly equivalent floors to whole cents
 * so we never overstate the discount (e.g. $2.49, not a rounded up $2.50).
 */
export function yearlySavings(): {
  /** Cost of twelve monthly payments, in cents. */
  twelveMonthsCents: number;
  /** Dollars saved per year by choosing yearly, in cents. */
  savingsCents: number;
  /** Whole-number percent saved, e.g. 50. */
  savingsPercent: number;
  /** Effective monthly cost of the yearly plan, floored to cents. */
  monthlyEquivalentCents: number;
} {
  const twelveMonthsCents = PLANS.monthly.priceCents * 12;
  const savingsCents = twelveMonthsCents - PLANS.yearly.priceCents;
  const savingsPercent = Math.round((savingsCents / twelveMonthsCents) * 100);
  const monthlyEquivalentCents = Math.floor(PLANS.yearly.priceCents / 12);
  return { twelveMonthsCents, savingsCents, savingsPercent, monthlyEquivalentCents };
}
