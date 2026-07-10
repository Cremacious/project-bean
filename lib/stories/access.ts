// lib/stories/access.ts
//
// The single rule that decides whether a story may be read (issue #34). It is a
// pure function of the story's tier and the parent's subscription, so it can be
// unit tested without a database and reused anywhere a story is shown or served.
//
// Reuse, do not re-derive: the subscription comes from lib/entitlements
// (getSubscription), the one app-wide source of billing truth from #33. `isActive`
// already folds in trials (trialing) and the fail-safe default (any unknown or
// errored state resolves to not subscribed), so this stays a one-liner.
import type { Subscription } from "@/lib/entitlements";

/**
 * Whether a story may be read right now.
 *  - Free stories (premium === false) are always readable, even signed out.
 *  - Premium stories require an active entitlement (active, trialing, grace, or a
 *    still-running canceled period), which is exactly what `subscription.isActive`
 *    encodes.
 */
export function isStoryUnlocked(premium: boolean, subscription: Subscription): boolean {
  if (!premium) return true;
  return subscription.isActive;
}
