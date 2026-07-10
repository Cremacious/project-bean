// app/api/revenuecat/webhook/route.ts
//
// RevenueCat webhook (issue #33). RevenueCat POSTs subscription lifecycle
// events here; we verify the shared-secret Authorization header, map the event
// to the parent's entitlement, and upsert it. The parent is identified by the
// event's `app_user_id`, which is the parent account id (never child data;
// docs/COMPLIANCE-COPPA.md section 6c).
//
// Fail-safe responses:
//   - not configured (no webhook secret, e.g. local dev) -> 503
//   - missing or wrong Authorization header               -> 401
//   - unparseable body                                    -> 400
//   - event with no entitlement change                    -> 200 (acknowledged no-op)
//   - persistence failure                                 -> 500 (RevenueCat retries)
import {
  isRevenueCatConfigured,
  verifyWebhookAuth,
  mapEventToEntitlement,
  type RevenueCatWebhookBody,
} from "@/lib/revenuecat";
import { upsertEntitlementRow } from "@/lib/entitlement-store";

export async function POST(request: Request): Promise<Response> {
  if (!isRevenueCatConfigured()) {
    return new Response("RevenueCat webhook not configured", { status: 503 });
  }
  if (!verifyWebhookAuth(request.headers.get("authorization"))) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: RevenueCatWebhookBody;
  try {
    body = (await request.json()) as RevenueCatWebhookBody;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const mapped = mapEventToEntitlement(body.event);
  if (!mapped) {
    return new Response("Ignored", { status: 200 });
  }

  try {
    await upsertEntitlementRow(mapped.appUserId, {
      status: mapped.status,
      productId: mapped.productId,
      source: "revenuecat",
      currentPeriodEnd: mapped.currentPeriodEnd,
    });
  } catch (err) {
    console.error("Failed to persist RevenueCat entitlement.", err);
    return new Response("Persistence error", { status: 500 });
  }

  return new Response("OK", { status: 200 });
}
