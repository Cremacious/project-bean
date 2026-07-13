"use server";
//
// lib/subscribe-actions.ts
//
// The server seam the plan-selection UI calls to begin a subscription (issue #35).
//
// Billing approach (issue #33, option c): the web app does NOT sell subscriptions
// today. Purchasing happens in the native app (milestone M6). So this action does
// the safe server-side work it can do now (authenticate, validate the chosen
// plan, and re-check that the parent is not already entitled), then reports that
// checkout is deferred to the native app. It deliberately does NOT grant any
// entitlement: faking a successful purchase on the web is explicitly out of scope.
//
// #55 replaces the deferred branch with a real checkout (creating a RevenueCat /
// store purchase). Entitlement still flows in through the verified webhook
// (app/api/revenuecat/webhook), never from a client-trusted success on the web.
//
// Security: Server Actions are reachable by direct POST, so we authenticate and
// validate inside the action rather than trusting the caller.
import { getParent } from "@/lib/session";
import { getSubscription } from "@/lib/entitlements";
import { isPlanKey, type PlanKey } from "@bedtime-quests/core/plans";

export type StartSubscriptionResult =
  | { ok: true; outcome: "deferred_to_native"; planKey: PlanKey }
  | { ok: false; reason: "unauthenticated" | "invalid_plan" | "already_subscribed" };

/**
 * Begin subscribing to the given plan. The parental gate (#32) is enforced on the
 * client before this is called; this action is the payment-side seam.
 */
export async function startSubscription(planKey: string): Promise<StartSubscriptionResult> {
  const parent = await getParent();
  if (!parent) return { ok: false, reason: "unauthenticated" };

  if (!isPlanKey(planKey)) return { ok: false, reason: "invalid_plan" };
  const plan: PlanKey = planKey;

  // Defense in depth: a parent who is already entitled (paid or on a trial) has
  // nothing to buy. Read through the #33 abstraction so trial counts as active.
  const subscription = await getSubscription(parent);
  if (subscription.isActive) return { ok: false, reason: "already_subscribed" };

  // Web does not process the purchase (option c). Hand off to the native app.
  return { ok: true, outcome: "deferred_to_native", planKey: plan };
}
