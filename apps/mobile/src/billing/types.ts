// apps/mobile/src/billing/types.ts
//
// The billing seam (issue #55). The paywall and store are written against this
// BillingProvider interface, satisfied at runtime by either the real RevenueCat
// provider (a dev build with store products) or an in-memory mock (Expo Go / CI /
// this repo). This mirrors the app's data-layer pattern (src/data/types.ts): the
// UI depends on the interface, so swapping the mock for the real provider is a
// factory choice, not a screen rewrite.
//
// Every entitlement value here is the SAME core Subscription the rest of the app
// gates on, so a purchase unlocks premium through the exact #33 rules used on web.
import type { PlanKey } from "@bedtime-quests/core/plans";
import type { Subscription } from "@bedtime-quests/core/entitlements";

/** A plan as shown on the paywall: core copy plus the store's localized price. */
export type OfferedPlan = {
  key: PlanKey;
  /** Display name, "Monthly" / "Yearly". */
  name: string;
  /** Localized price string from the store ("$4.99"); the mock uses core prices. */
  priceString: string;
  /** Billing period word for copy. */
  period: "month" | "year";
  /** The store product identifier this plan purchases. */
  productId: string;
  /** True for the highlighted best-value plan. */
  highlight: boolean;
};

/**
 * The result of a purchase attempt. Every branch is a state the paywall must
 * handle with warm, dash-free copy (issue #55 requirement 5): a parent is never
 * dead-ended.
 *   success   - entitlement is now active; premium unlocks immediately.
 *   cancelled - the parent backed out of the store sheet; nothing was charged.
 *   pending   - deferred approval (e.g. Ask to Buy); it may complete later.
 *   error     - something went wrong; the parent can try again.
 */
export type PurchaseOutcome =
  | { kind: "success"; subscription: Subscription }
  | { kind: "cancelled" }
  | { kind: "pending" }
  | { kind: "error"; message: string };

/** The result of restoring prior purchases. */
export type RestoreOutcome =
  | { kind: "restored"; subscription: Subscription }
  | { kind: "none" }
  | { kind: "error"; message: string };

export interface BillingProvider {
  /** Which implementation this is, for logs and the deferred-verification banner. */
  readonly name: "revenuecat" | "mock";

  /**
   * Configure the SDK once at startup. `appUserId` is a PARENT scoped id (never a
   * child; COPPA section 6c), or null to start anonymous until sign in.
   */
  configure(appUserId: string | null): Promise<void>;

  /** Associate purchases with a parent account; returns their entitlement. */
  logIn(appUserId: string): Promise<Subscription>;

  /** Detach the parent on sign out (returns to anonymous). */
  logOut(): Promise<void>;

  /** The plans available to buy, in display order (monthly, then yearly). */
  getOfferings(): Promise<OfferedPlan[]>;

  /** Read the parent's current entitlement from the source of truth. */
  getEntitlement(): Promise<Subscription>;

  /** Buy or start the free trial for the given plan. */
  purchase(planKey: PlanKey): Promise<PurchaseOutcome>;

  /** Restore prior purchases for the signed-in account. */
  restore(): Promise<RestoreOutcome>;
}
