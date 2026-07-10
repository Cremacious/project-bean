// lib/revenuecat.ts
//
// RevenueCat integration seam (issue #33). For the web app today (option c) we
// do NOT sell subscriptions on the web; RevenueCat becomes the source of truth
// once the native apps ship (milestone M6). This module holds the pieces that
// let RevenueCat *write* a parent's entitlement into our store via a
// signature-verified webhook, plus the env-gated config.
//
// It is deliberately inert when the RevenueCat env vars are absent, so local
// dev and CI (which have none) run without RevenueCat and never crash. This
// mirrors the conditional social-provider pattern in lib/auth.ts.
//
// COPPA (docs/COMPLIANCE-COPPA.md section 6c): a RevenueCat `app_user_id` is the
// PARENT account id only; no child name, id, or attributes are ever sent.
import crypto from "node:crypto";

/**
 * The shared secret RevenueCat sends in the webhook `Authorization` header.
 * Configured in the RevenueCat dashboard and mirrored here. When unset, the
 * webhook treats every request as unauthorized (fail safe).
 */
export function webhookAuthToken(): string | undefined {
  const token = process.env.REVENUECAT_WEBHOOK_AUTH_TOKEN;
  return token && token.length > 0 ? token : undefined;
}

/** True only when the webhook is configured (a token is present). */
export function isRevenueCatConfigured(): boolean {
  return webhookAuthToken() !== undefined;
}

/**
 * Constant-time check of the incoming Authorization header against the
 * configured token. Returns false if no token is configured or no header is
 * present, so an unconfigured deployment rejects (never accepts) webhooks.
 */
export function verifyWebhookAuth(header: string | null | undefined): boolean {
  const expected = webhookAuthToken();
  if (!expected || !header) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  // timingSafeEqual throws on length mismatch, so guard length first.
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// The subset of a RevenueCat webhook event we act on. RevenueCat POSTs
// { api_version, event: { ... } }; see their "Webhooks" reference for the full
// shape. We only read what drives entitlement state.
export type RevenueCatEvent = {
  type?: string;
  app_user_id?: string;
  product_id?: string | null;
  period_type?: string; // "TRIAL" | "INTRO" | "NORMAL"
  expiration_at_ms?: number | null;
};

export type RevenueCatWebhookBody = { event?: RevenueCatEvent };

export type MappedEntitlement = {
  appUserId: string;
  status: "trialing" | "active" | "canceled" | "expired";
  productId: string | null;
  currentPeriodEnd: Date | null;
};

// Event types that carry no entitlement change; acknowledged and ignored.
const IGNORED_EVENT_TYPES = new Set(["TEST", "SUBSCRIBER_ALIAS", "TRANSFER"]);

/**
 * Translate a RevenueCat webhook event into an entitlement patch for a parent,
 * or null when the event carries no actionable change (or lacks an
 * app_user_id). The active/inactive decision itself is left to computeIsActive
 * at read time, driven by the resulting status + currentPeriodEnd.
 */
export function mapEventToEntitlement(event: RevenueCatEvent | undefined): MappedEntitlement | null {
  if (!event || !event.type || !event.app_user_id) return null;
  if (IGNORED_EVENT_TYPES.has(event.type)) return null;

  const currentPeriodEnd =
    typeof event.expiration_at_ms === "number" ? new Date(event.expiration_at_ms) : null;

  let status: MappedEntitlement["status"];
  if (event.type === "EXPIRATION") {
    status = "expired";
  } else if (event.type === "CANCELLATION") {
    // Auto-renew turned off; the parent stays entitled until currentPeriodEnd.
    status = "canceled";
  } else if (event.period_type === "TRIAL") {
    status = "trialing";
  } else {
    status = "active";
  }

  return {
    appUserId: event.app_user_id,
    status,
    productId: event.product_id ?? null,
    currentPeriodEnd,
  };
}
