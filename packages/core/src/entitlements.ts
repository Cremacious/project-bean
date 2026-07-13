// packages/core/src/entitlements.ts
//
// Pure entitlement RULES and types (issue #33). This is the platform-agnostic
// half of the old lib/entitlements.ts: the status vocabulary, the "is this
// entitlement active right now?" computation, and the safe not-subscribed
// default. Data access (reading/writing the billing row) stays on each platform
// behind its own store; the web wrapper lives in lib/entitlements.ts and re-uses
// everything here so the gating logic exists in exactly one place.

export type SubscriptionStatus =
  | "none"
  | "trialing"
  | "active"
  | "grace"
  | "canceled"
  | "expired";

export type Subscription = {
  status: SubscriptionStatus;
  productId: string | null;
  source: "internal" | "revenuecat";
  currentPeriodEnd: Date | null;
  /** The computed entitlement: true only if the parent may access paid content right now. */
  isActive: boolean;
};

export const NOT_SUBSCRIBED: Subscription = {
  status: "none",
  productId: null,
  source: "internal",
  currentPeriodEnd: null,
  isActive: false,
};

// Statuses that entitle the parent (subject to the period-end check below).
// "canceled" still counts while the already-paid period runs.
export const ENTITLING_STATUSES = new Set<SubscriptionStatus>([
  "trialing",
  "active",
  "grace",
  "canceled",
]);

export function normalizeStatus(raw: string): SubscriptionStatus {
  switch (raw) {
    case "trialing":
    case "active":
    case "grace":
    case "canceled":
    case "expired":
    case "none":
      return raw;
    default:
      return "none"; // unknown persisted value -> treat as not subscribed
  }
}

/**
 * Whether an entitlement is currently active. A null period end means no expiry
 * (e.g. an internal comp grant); a period end in the past is always inactive,
 * even if a status-changing webhook was missed.
 */
export function computeIsActive(
  status: SubscriptionStatus,
  currentPeriodEnd: Date | null,
  now: Date = new Date(),
): boolean {
  if (!ENTITLING_STATUSES.has(status)) return false;
  if (currentPeriodEnd && currentPeriodEnd.getTime() <= now.getTime()) return false;
  return true;
}
