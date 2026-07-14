// packages/core/src/revenuecat-client.ts
//
// The CLIENT side of the RevenueCat integration (issue #55): a pure function that
// turns the "premium" entitlement RevenueCat reports on-device into the SAME
// Subscription shape the rest of the app gates on (issue #33). This is the native
// twin of the web webhook mapper (lib/revenuecat.ts, mapEventToEntitlement): the
// webhook maps server events, this maps the SDK's CustomerInfo, and BOTH feed
// computeIsActive so web and native agree on "is this parent subscribed".
//
// It stays pure and SDK-free: the native billing provider extracts a small
// snapshot from the react-native-purchases EntitlementInfo and passes it here, so
// this logic unit tests without the native module (which needs a dev build).
//
// COPPA (docs/COMPLIANCE-COPPA.md section 6c): nothing here reads or carries child
// data; the entitlement belongs to the parent account only.
import {
  type Subscription,
  type SubscriptionStatus,
  NOT_SUBSCRIBED,
  computeIsActive,
} from "./entitlements";

/**
 * The minimal slice of a RevenueCat `EntitlementInfo` (the active "premium"
 * entitlement) that our mapping needs. The provider reads these off the SDK's
 * CustomerInfo; keeping the shape tiny and primitive is what lets this file be
 * tested with no SDK present.
 */
export type RevenueCatEntitlementSnapshot = {
  /** RevenueCat's own "is this entitlement active" flag. */
  isActive: boolean;
  /** Whether the subscription is set to auto renew. False after a cancel. */
  willRenew: boolean;
  /** "NORMAL" | "INTRO" | "TRIAL" (case insensitive); TRIAL means free trial. */
  periodType: string;
  /** The store product id that granted this entitlement, e.g. the monthly product. */
  productIdentifier: string | null;
  /** Expiry as epoch milliseconds, or null for a no expiry (lifetime) grant. */
  expirationDateMs: number | null;
  /** True when RevenueCat has detected a billing problem (maps to our grace state). */
  billingIssueDetected: boolean;
};

/**
 * Map the parent's active "premium" entitlement (or null when they have none)
 * into a Subscription. Passing null yields the safe not-subscribed default, which
 * is exactly what the provider should pass when RevenueCat reports no active
 * entitlement, so a signed out or free parent reads as not subscribed.
 *
 * The status is derived the same way the web webhook derives it:
 *   - a free trial period      -> "trialing"
 *   - a detected billing issue -> "grace" (still on, needs a payment fix)
 *   - auto renew turned off     -> "canceled" (entitled until the period ends)
 *   - otherwise                 -> "active"
 * and `isActive` is recomputed by computeIsActive from status + period end, so an
 * entitlement whose expiry has passed never unlocks content even if the snapshot
 * still claimed active.
 */
export function subscriptionFromRevenueCat(
  snapshot: RevenueCatEntitlementSnapshot | null | undefined,
  now: Date = new Date(),
): Subscription {
  if (!snapshot) return NOT_SUBSCRIBED;

  const currentPeriodEnd =
    typeof snapshot.expirationDateMs === "number" ? new Date(snapshot.expirationDateMs) : null;

  let status: SubscriptionStatus;
  if (snapshot.periodType.toUpperCase() === "TRIAL") {
    status = "trialing";
  } else if (snapshot.billingIssueDetected) {
    status = "grace";
  } else if (!snapshot.willRenew) {
    status = "canceled";
  } else {
    status = "active";
  }

  return {
    status,
    productId: snapshot.productIdentifier ?? null,
    source: "revenuecat",
    currentPeriodEnd,
    isActive: computeIsActive(status, currentPeriodEnd, now),
  };
}
