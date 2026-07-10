"use server";
//
// lib/restore-actions.ts
//
// The "Restore purchases" server seam for the parent account page (issue #36).
//
// Billing approach (issue #33, option c): the web app does not process purchases;
// a parent's entitlement is written server side by the RevenueCat webhook when
// they subscribe (in the native app, milestone M6, or on another device). So on
// the web "restore" means: re-read this signed in parent's entitlement through the
// single #33 abstraction and report whether premium is now unlocked. That is the
// honest, useful behavior. A parent who subscribed elsewhere but is signed in with
// the same account gets their access back; one who never subscribed is told plainly
// that nothing was found. No entitlement is ever granted from here.
//
// Security: Server Actions are reachable by direct POST, so we authenticate inside
// the action and read only the adult account's own entitlement (COPPA).
import { getParent } from "@/lib/session";
import { getSubscription } from "@/lib/entitlements";

export type RestoreResult =
  | { ok: true; restored: boolean }
  | { ok: false; reason: "unauthenticated" };

/**
 * Re-check the signed in parent's entitlement and report whether premium is active.
 * `restored: true` means an active subscription (paid or trial) was found for this
 * account; `restored: false` means nothing entitling was found. Never throws: the
 * #33 read fails safe to "not subscribed".
 */
export async function restorePurchases(): Promise<RestoreResult> {
  const parent = await getParent();
  if (!parent) return { ok: false, reason: "unauthenticated" };

  const subscription = await getSubscription(parent);
  return { ok: true, restored: subscription.isActive };
}
