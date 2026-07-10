import { describe, it, expect } from "vitest";
import type { Subscription, SubscriptionStatus } from "@/lib/entitlements";
import { computeIsActive } from "@/lib/entitlements";
import { isStoryUnlocked } from "./access";

// Build a Subscription the same way getSubscription does, so isActive is derived
// by the real rule (trials included) rather than hand-set.
function sub(status: SubscriptionStatus, currentPeriodEnd: Date | null = null): Subscription {
  return {
    status,
    productId: status === "none" ? null : "monthly",
    source: "revenuecat",
    currentPeriodEnd,
    isActive: computeIsActive(status, currentPeriodEnd),
  };
}

const notSubscribed = sub("none");
const active = sub("active");
const trialing = sub("trialing", new Date(Date.now() + 86_400_000));
const expired = sub("expired");

describe("isStoryUnlocked", () => {
  it("lets anyone read a free story, subscribed or not", () => {
    expect(isStoryUnlocked(false, notSubscribed)).toBe(true);
    expect(isStoryUnlocked(false, active)).toBe(true);
    expect(isStoryUnlocked(false, trialing)).toBe(true);
    expect(isStoryUnlocked(false, expired)).toBe(true);
  });

  it("locks a premium story for a non-subscriber", () => {
    expect(isStoryUnlocked(true, notSubscribed)).toBe(false);
  });

  it("unlocks a premium story for an active subscriber", () => {
    expect(isStoryUnlocked(true, active)).toBe(true);
  });

  it("unlocks a premium story during the free trial", () => {
    expect(isStoryUnlocked(true, trialing)).toBe(true);
  });

  it("locks a premium story once the subscription has expired", () => {
    expect(isStoryUnlocked(true, expired)).toBe(false);
  });

  it("locks a premium story when a paid period has already ended", () => {
    expect(isStoryUnlocked(true, sub("active", new Date(1000)))).toBe(false);
  });
});
