// packages/core/src/revenuecat-client.test.ts
import { describe, expect, it } from "vitest";
import { subscriptionFromRevenueCat, type RevenueCatEntitlementSnapshot } from "./revenuecat-client";
import { NOT_SUBSCRIBED } from "./entitlements";
import { PRODUCT_ID_MONTHLY, PRODUCT_ID_YEARLY } from "./plans";

const NOW = new Date("2026-07-14T00:00:00.000Z");
const FUTURE = new Date("2026-08-14T00:00:00.000Z").getTime();
const PAST = new Date("2026-06-14T00:00:00.000Z").getTime();

function snap(over: Partial<RevenueCatEntitlementSnapshot> = {}): RevenueCatEntitlementSnapshot {
  return {
    isActive: true,
    willRenew: true,
    periodType: "NORMAL",
    productIdentifier: PRODUCT_ID_YEARLY,
    expirationDateMs: FUTURE,
    billingIssueDetected: false,
    ...over,
  };
}

describe("subscriptionFromRevenueCat", () => {
  it("returns the safe not-subscribed default for no active entitlement", () => {
    expect(subscriptionFromRevenueCat(null, NOW)).toEqual(NOT_SUBSCRIBED);
    expect(subscriptionFromRevenueCat(undefined, NOW)).toEqual(NOT_SUBSCRIBED);
  });

  it("maps an active auto-renewing subscription to active + entitled", () => {
    const sub = subscriptionFromRevenueCat(snap({ productIdentifier: PRODUCT_ID_MONTHLY }), NOW);
    expect(sub.status).toBe("active");
    expect(sub.source).toBe("revenuecat");
    expect(sub.productId).toBe(PRODUCT_ID_MONTHLY);
    expect(sub.isActive).toBe(true);
    expect(sub.currentPeriodEnd?.getTime()).toBe(FUTURE);
  });

  it("maps a free trial period to trialing (still entitled)", () => {
    const sub = subscriptionFromRevenueCat(snap({ periodType: "TRIAL" }), NOW);
    expect(sub.status).toBe("trialing");
    expect(sub.isActive).toBe(true);
  });

  it("is case insensitive about the trial period type", () => {
    expect(subscriptionFromRevenueCat(snap({ periodType: "trial" }), NOW).status).toBe("trialing");
  });

  it("maps auto-renew-off to canceled but keeps it entitled until the period ends", () => {
    const sub = subscriptionFromRevenueCat(snap({ willRenew: false }), NOW);
    expect(sub.status).toBe("canceled");
    expect(sub.isActive).toBe(true);
  });

  it("maps a detected billing issue to grace (still on, needs a fix)", () => {
    const sub = subscriptionFromRevenueCat(snap({ billingIssueDetected: true }), NOW);
    expect(sub.status).toBe("grace");
    expect(sub.isActive).toBe(true);
  });

  it("prefers trial over a billing issue or cancel when in the trial period", () => {
    const sub = subscriptionFromRevenueCat(
      snap({ periodType: "TRIAL", willRenew: false, billingIssueDetected: true }),
      NOW,
    );
    expect(sub.status).toBe("trialing");
  });

  it("does not unlock content when the entitlement has already expired", () => {
    // Even if the snapshot still claims active, a past period end fails safe.
    const sub = subscriptionFromRevenueCat(snap({ expirationDateMs: PAST }), NOW);
    expect(sub.isActive).toBe(false);
  });

  it("treats a null expiry as a no-expiry (lifetime) grant that stays active", () => {
    const sub = subscriptionFromRevenueCat(snap({ expirationDateMs: null }), NOW);
    expect(sub.currentPeriodEnd).toBeNull();
    expect(sub.isActive).toBe(true);
  });
});
