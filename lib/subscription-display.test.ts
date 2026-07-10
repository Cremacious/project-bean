import { describe, it, expect } from "vitest";
import { describeSubscription, daysUntil, formatDate } from "./subscription-display";
import type { Subscription } from "./entitlements";
import { PLANS } from "./plans";

// Status-display logic for the parent account subscription area (issue #36).
// describeSubscription is pure: we hand it a Subscription (the shape the single #33
// abstraction returns) and a fixed `now`, and assert the plain, dash-free copy. No
// billing provider or DB is involved; the Subscription already came through the
// fail-safe read, so these cases are just the display mapping.

const NOW = new Date("2026-07-10T00:00:00Z");

function sub(partial: Partial<Subscription>): Subscription {
  return {
    status: "none",
    productId: null,
    source: "revenuecat",
    currentPeriodEnd: null,
    isActive: false,
    ...partial,
  };
}

// No dash characters may appear in any user-facing string (UI rule 1).
function expectDashFree(display: { title: string; detail: string }) {
  expect(display.title).not.toMatch(/[-‐-―]/);
  expect(display.detail).not.toMatch(/[-‐-―]/);
}

describe("describeSubscription", () => {
  it("shows a free trial with the days left and the paid-start date", () => {
    const end = new Date("2026-07-15T00:00:00Z"); // 5 days after NOW
    const display = describeSubscription(
      sub({ status: "trialing", isActive: true, productId: PLANS.yearly.productId, currentPeriodEnd: end }),
      NOW,
    );

    expect(display.title).toBe("Free trial");
    expect(display.trialDaysLeft).toBe(5);
    expect(display.detail).toContain("5 days left");
    expect(display.detail).toContain(formatDate(end));
    expect(display.variant).toBe("trial");
    expect(display.isActive).toBe(true);
    expect(display.showManage).toBe(true);
    expect(display.showUpgrade).toBe(false);
    expectDashFree(display);
  });

  it("says '1 day' (singular) when a trial has one day left", () => {
    const end = new Date("2026-07-11T00:00:00Z"); // 1 day after NOW
    const display = describeSubscription(
      sub({ status: "trialing", isActive: true, currentPeriodEnd: end }),
      NOW,
    );
    expect(display.trialDaysLeft).toBe(1);
    expect(display.detail).toContain("1 day left");
    expect(display.detail).not.toContain("1 days");
  });

  it("labels an active monthly plan and its renewal date", () => {
    const end = new Date("2026-08-09T00:00:00Z");
    const display = describeSubscription(
      sub({ status: "active", isActive: true, productId: PLANS.monthly.productId, currentPeriodEnd: end }),
      NOW,
    );

    expect(display.title).toBe("Premium monthly");
    expect(display.planName).toBe("Monthly");
    expect(display.detail).toBe(`Your subscription renews on ${formatDate(end)}.`);
    expect(display.variant).toBe("active");
    expect(display.showManage).toBe(true);
    expect(display.showUpgrade).toBe(false);
    expectDashFree(display);
  });

  it("labels an active yearly plan and its renewal date", () => {
    const end = new Date("2027-07-10T00:00:00Z");
    const display = describeSubscription(
      sub({ status: "active", isActive: true, productId: PLANS.yearly.productId, currentPeriodEnd: end }),
      NOW,
    );

    expect(display.title).toBe("Premium yearly");
    expect(display.planName).toBe("Yearly");
    expect(display.detail).toContain(formatDate(end));
    expect(display.variant).toBe("active");
    expectDashFree(display);
  });

  it("reads 'Premium' with no plan name for an internal comp grant", () => {
    const display = describeSubscription(
      sub({ status: "active", isActive: true, productId: null, source: "internal", currentPeriodEnd: null }),
      NOW,
    );
    expect(display.title).toBe("Premium");
    expect(display.planName).toBeNull();
    expect(display.detail).toBe("Your subscription is active.");
  });

  it("shows the not-subscribed state with an upgrade prompt", () => {
    const display = describeSubscription(sub({ status: "none", isActive: false }), NOW);

    expect(display.title).toBe("Not subscribed");
    expect(display.variant).toBe("none");
    expect(display.showUpgrade).toBe(true);
    expect(display.showManage).toBe(false);
    expect(display.trialDaysLeft).toBeNull();
    expect(display.renewalDate).toBeNull();
    expectDashFree(display);
  });

  it("treats an expired entitlement (isActive false) as not subscribed", () => {
    const display = describeSubscription(
      sub({ status: "expired", isActive: false, productId: PLANS.monthly.productId }),
      NOW,
    );
    expect(display.title).toBe("Not subscribed");
    expect(display.showUpgrade).toBe(true);
  });

  it("explains a canceled plan is still on until it ends", () => {
    const end = new Date("2026-07-20T00:00:00Z");
    const display = describeSubscription(
      sub({ status: "canceled", isActive: true, productId: PLANS.yearly.productId, currentPeriodEnd: end }),
      NOW,
    );
    expect(display.title).toBe("Premium ending");
    expect(display.detail).toContain(formatDate(end));
    expect(display.detail).toContain("will not renew");
    expect(display.variant).toBe("attention");
    expect(display.showManage).toBe(true);
    expectDashFree(display);
  });

  it("flags a grace-period payment problem without dropping access", () => {
    const display = describeSubscription(
      sub({ status: "grace", isActive: true, productId: PLANS.monthly.productId }),
      NOW,
    );
    expect(display.title).toBe("Payment needed");
    expect(display.isActive).toBe(true);
    expect(display.variant).toBe("attention");
    expectDashFree(display);
  });
});

describe("daysUntil", () => {
  it("rounds partial days up", () => {
    expect(daysUntil(new Date("2026-07-11T12:00:00Z"), NOW)).toBe(2);
  });
  it("is 0 for a past date and null for no date", () => {
    expect(daysUntil(new Date("2026-07-09T00:00:00Z"), NOW)).toBe(0);
    expect(daysUntil(null, NOW)).toBeNull();
  });
});
