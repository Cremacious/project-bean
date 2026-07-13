import { describe, it, expect } from "vitest";
import {
  PLANS,
  PLAN_LIST,
  TRIAL_DAYS,
  PRODUCT_ID_MONTHLY,
  PRODUCT_ID_YEARLY,
  isPlanKey,
  getPlan,
  formatUsd,
  yearlySavings,
} from "./plans";

describe("plan catalog", () => {
  it("offers monthly at $4.99 and yearly at $29.99 with a 7 day trial", () => {
    expect(PLANS.monthly.priceCents).toBe(499);
    expect(PLANS.yearly.priceCents).toBe(2999);
    expect(TRIAL_DAYS).toBe(7);
  });

  it("carries the RevenueCat product ids the stores must match (#55)", () => {
    expect(PLANS.monthly.productId).toBe(PRODUCT_ID_MONTHLY);
    expect(PLANS.yearly.productId).toBe(PRODUCT_ID_YEARLY);
    expect(PRODUCT_ID_MONTHLY).not.toBe(PRODUCT_ID_YEARLY);
  });

  it("highlights only the yearly plan and lists monthly first", () => {
    expect(PLAN_LIST.map((p) => p.key)).toEqual(["monthly", "yearly"]);
    expect(PLANS.yearly.highlight).toBe(true);
    expect(PLANS.monthly.highlight).toBe(false);
  });

  it("uses dash free billing cadence copy", () => {
    for (const plan of PLAN_LIST) {
      expect(plan.cadence).not.toMatch(/[-–—]/);
    }
    expect(PLANS.yearly.cadence).toBe("billed yearly");
  });
});

describe("isPlanKey / getPlan", () => {
  it("accepts only known plan keys", () => {
    expect(isPlanKey("monthly")).toBe(true);
    expect(isPlanKey("yearly")).toBe(true);
    expect(isPlanKey("weekly")).toBe(false);
    expect(isPlanKey(null)).toBe(false);
    expect(isPlanKey(undefined)).toBe(false);
    expect(isPlanKey(1)).toBe(false);
  });

  it("returns the plan for a valid key and null otherwise", () => {
    expect(getPlan("yearly")).toBe(PLANS.yearly);
    expect(getPlan("bogus")).toBeNull();
  });
});

describe("formatUsd", () => {
  it("formats whole cents as a dollar string", () => {
    expect(formatUsd(499)).toBe("$4.99");
    expect(formatUsd(2999)).toBe("$29.99");
    expect(formatUsd(0)).toBe("$0.00");
  });
});

describe("yearlySavings", () => {
  const s = yearlySavings();

  it("compares a year of yearly against twelve monthly payments", () => {
    expect(s.twelveMonthsCents).toBe(499 * 12); // 5988
    expect(s.savingsCents).toBe(5988 - 2999); // 2989
  });

  it("reports the whole number percent saved (about half)", () => {
    expect(s.savingsPercent).toBe(50);
  });

  it("floors the effective monthly cost so the discount is never overstated", () => {
    // 2999 / 12 = 249.9..., floored to 249 cents ($2.49), not rounded up to $2.50.
    expect(s.monthlyEquivalentCents).toBe(249);
    expect(formatUsd(s.monthlyEquivalentCents)).toBe("$2.49");
  });
});
