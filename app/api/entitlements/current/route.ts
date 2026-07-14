// app/api/entitlements/current/route.ts
//
// The entitlement reconciliation endpoint for the native app (issue #55; the
// "Current entitlement" row the mobile README listed as a missing REST endpoint).
// RevenueCat is the on-device source of truth, so native gating already works
// without this; this endpoint lets the app cross check the SERVER's view of the
// account (the row the RevenueCat webhook writes) so web and native agree even if
// a device missed an event. It returns the SAME #33 Subscription the web app gates
// on, read through the single fail-safe abstraction.
//
// Auth: it authenticates the caller itself (getParent reads the BetterAuth session
// from cookies on web, or the Authorization bearer token once @better-auth/expo is
// wired for native), and returns 401 JSON when there is no signed-in parent. It is
// allowlisted in proxy.ts so an unauthenticated request gets this 401 instead of an
// HTML redirect to /sign-in.
//
// COPPA (docs/COMPLIANCE-COPPA.md section 6c): reads only the adult account's own
// entitlement row; no child data is ever involved.
import { getParent } from "@/lib/session";
import { getSubscription } from "@/lib/entitlements";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const parent = await getParent();
  if (!parent) {
    return Response.json({ error: "unauthenticated" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  const subscription = await getSubscription(parent);
  return Response.json(
    {
      status: subscription.status,
      productId: subscription.productId,
      source: subscription.source,
      currentPeriodEnd: subscription.currentPeriodEnd ? subscription.currentPeriodEnd.toISOString() : null,
      isActive: subscription.isActive,
    },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
