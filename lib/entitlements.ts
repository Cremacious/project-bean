// lib/entitlements.ts
//
// The single, app-wide way to answer "is this parent subscribed?" (issue #33).
// Every downstream surface reads through getSubscription() / isSubscribed() and
// never queries billing state directly: the paywall and free-tier gate (#34),
// plans and trial (#35), and manage/restore (#36) all build on these.
//
// Design guarantees:
//  - Fail safe: any unknown, missing, or errored state resolves to NOT
//    subscribed. A billing outage must never unlock paid content, and it must
//    never crash a page, so getSubscription always resolves and never throws.
//  - Crash free without RevenueCat: entitlements can be read (and, in option c,
//    granted internally) with no RevenueCat keys present, so local dev runs.
//  - Parent scoped (COPPA, docs/COMPLIANCE-COPPA.md section 6c): this reads only
//    the adult account's row; no child data is ever involved.
import type { Parent } from "@/lib/session";
import { getEntitlementRow, upsertEntitlementRow } from "@/lib/entitlement-store";

export type SubscriptionStatus =
  | "none"
  | "trialing"
  | "active"
  | "grace"
  | "canceled"
  | "expired";

export type Subscription = {
  status: SubscriptionStatus;
  productId: string | null;
  source: "internal" | "revenuecat";
  currentPeriodEnd: Date | null;
  /** The computed entitlement: true only if the parent may access paid content right now. */
  isActive: boolean;
};

const NOT_SUBSCRIBED: Subscription = {
  status: "none",
  productId: null,
  source: "internal",
  currentPeriodEnd: null,
  isActive: false,
};

// Statuses that entitle the parent (subject to the period-end check below).
// "canceled" still counts while the already-paid period runs.
const ENTITLING_STATUSES = new Set<SubscriptionStatus>([
  "trialing",
  "active",
  "grace",
  "canceled",
]);

function normalizeStatus(raw: string): SubscriptionStatus {
  switch (raw) {
    case "trialing":
    case "active":
    case "grace":
    case "canceled":
    case "expired":
    case "none":
      return raw;
    default:
      return "none"; // unknown persisted value -> treat as not subscribed
  }
}

/**
 * Whether an entitlement is currently active. A null period end means no expiry
 * (e.g. an internal comp grant); a period end in the past is always inactive,
 * even if a status-changing webhook was missed.
 */
export function computeIsActive(
  status: SubscriptionStatus,
  currentPeriodEnd: Date | null,
  now: Date = new Date(),
): boolean {
  if (!ENTITLING_STATUSES.has(status)) return false;
  if (currentPeriodEnd && currentPeriodEnd.getTime() <= now.getTime()) return false;
  return true;
}

/** The parent's subscription, or the safe not-subscribed default. Never throws. */
export async function getSubscription(parent: Parent | null): Promise<Subscription> {
  if (!parent) return NOT_SUBSCRIBED;
  try {
    const row = await getEntitlementRow(parent.id);
    if (!row) return NOT_SUBSCRIBED;
    const status = normalizeStatus(row.status);
    const source = row.source === "revenuecat" ? "revenuecat" : "internal";
    const currentPeriodEnd = row.currentPeriodEnd ?? null;
    return {
      status,
      productId: row.productId ?? null,
      source,
      currentPeriodEnd,
      isActive: computeIsActive(status, currentPeriodEnd),
    };
  } catch (err) {
    // Fail safe: a DB or billing error must never unlock content or crash a page.
    console.error("getSubscription failed; treating parent as not subscribed.", err);
    return NOT_SUBSCRIBED;
  }
}

/** True only if the parent currently has an active entitlement. Never throws. */
export async function isSubscribed(parent: Parent | null): Promise<boolean> {
  return (await getSubscription(parent)).isActive;
}

/**
 * Grant an internal entitlement to a parent, bypassing any billing provider.
 * This is how content gating is exercised on the web today (option c): an
 * admin/comp grant or a manual test, with no RevenueCat account required. Pass
 * `until` to time-box it; omit it (or pass null) for a no-expiry grant.
 */
export async function grantInternalEntitlement(
  parentId: string,
  opts: { productId?: string | null; until?: Date | null } = {},
): Promise<void> {
  await upsertEntitlementRow(parentId, {
    status: "active",
    productId: opts.productId ?? null,
    source: "internal",
    currentPeriodEnd: opts.until ?? null,
  });
}

/** Revoke any entitlement for a parent (marks it expired). */
export async function clearEntitlement(parentId: string): Promise<void> {
  await upsertEntitlementRow(parentId, {
    status: "expired",
    source: "internal",
    currentPeriodEnd: null,
  });
}
