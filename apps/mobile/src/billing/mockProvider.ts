// apps/mobile/src/billing/mockProvider.ts
//
// The in-memory billing provider (issue #55). It runs whenever RevenueCat is not
// available (Expo Go, CI, this repo, or a dev build with no public key), so the
// whole paywall flow is exercisable with NO store products: offerings render from
// core plans, a simulated purchase flips the parent to an active 7 day trial, and
// restore reads that back. Nothing is ever charged. The purchase outcome can be
// forced to cancelled / pending / error via EXPO_PUBLIC_BILLING_MOCK_OUTCOME so
// every paywall state is verifiable before real store products exist (#58/#59).
//
// It maps to the SAME core Subscription the real provider does, so the rest of the
// app cannot tell which provider unlocked premium.
import {
  PLAN_LIST,
  TRIAL_DAYS,
  formatUsd,
  getPlan,
  type PlanKey,
} from "@bedtime-quests/core/plans";
import { NOT_SUBSCRIBED, type Subscription } from "@bedtime-quests/core/entitlements";
import { mockPurchaseOutcome } from "./config";
import type { BillingProvider, OfferedPlan, PurchaseOutcome, RestoreOutcome } from "./types";

const DAY_MS = 86_400_000;

/** A trialing entitlement that expires TRIAL_DAYS from now, for the given plan. */
function trialSubscription(planKey: PlanKey): Subscription {
  const plan = getPlan(planKey);
  const end = new Date(Date.now() + TRIAL_DAYS * DAY_MS);
  return {
    status: "trialing",
    productId: plan ? plan.productId : null,
    source: "revenuecat",
    currentPeriodEnd: end,
    isActive: true,
  };
}

export class MockProvider implements BillingProvider {
  readonly name = "mock" as const;

  private current: Subscription = NOT_SUBSCRIBED;

  async configure(): Promise<void> {
    // No SDK to configure; the mock is ready immediately.
  }

  async logIn(): Promise<Subscription> {
    // A fresh parent starts not subscribed; a same-session purchase persists here.
    return this.current;
  }

  async logOut(): Promise<void> {
    this.current = NOT_SUBSCRIBED;
  }

  async getOfferings(): Promise<OfferedPlan[]> {
    return PLAN_LIST.map((plan) => ({
      key: plan.key,
      name: plan.name,
      priceString: formatUsd(plan.priceCents),
      period: plan.period,
      productId: plan.productId,
      highlight: plan.highlight,
    }));
  }

  async getEntitlement(): Promise<Subscription> {
    return this.current;
  }

  async purchase(planKey: PlanKey): Promise<PurchaseOutcome> {
    switch (mockPurchaseOutcome()) {
      case "cancelled":
        return { kind: "cancelled" };
      case "pending":
        return { kind: "pending" };
      case "error":
        return { kind: "error", message: "The purchase could not be completed." };
      default:
        this.current = trialSubscription(planKey);
        return { kind: "success", subscription: this.current };
    }
  }

  async restore(): Promise<RestoreOutcome> {
    return this.current.isActive
      ? { kind: "restored", subscription: this.current }
      : { kind: "none" };
  }
}
