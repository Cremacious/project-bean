// lib/entitlement-store.ts
//
// Persistence layer for parent subscription entitlements (issue #33). This is
// the ONLY module that touches the `subscription` table. lib/entitlements.ts
// wraps it with the fail-safe read helpers the rest of the app calls, and the
// RevenueCat webhook writes through upsertEntitlementRow. Keeping the raw table
// access here (and mockable) is what lets the entitlement helpers be unit
// tested without a database.
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { subscription } from "@/db/schema";

export type EntitlementRow = {
  parentId: string;
  status: string;
  productId: string | null;
  source: string;
  currentPeriodEnd: Date | null;
  // Admin override (issue #85): null/undefined = defer to billing, true/false =
  // force. Optional so callers and tests that predate it stay valid; the store
  // select always populates it.
  adminOverride?: boolean | null;
};

export type EntitlementPatch = {
  status: string;
  productId?: string | null;
  source: "internal" | "revenuecat";
  currentPeriodEnd?: Date | null;
};

/** The parent's entitlement row, or null if they have never had one. */
export async function getEntitlementRow(parentId: string): Promise<EntitlementRow | null> {
  const [row] = await db
    .select({
      parentId: subscription.parentId,
      status: subscription.status,
      productId: subscription.productId,
      source: subscription.source,
      currentPeriodEnd: subscription.currentPeriodEnd,
      adminOverride: subscription.adminOverride,
    })
    .from(subscription)
    .where(eq(subscription.parentId, parentId))
    .limit(1);
  return row ?? null;
}

/**
 * Set (or clear) the admin premium override for a parent (issue #85). Upserts a
 * row so an override can be applied to a parent who has never had a billing row.
 * Pass null to clear it and defer to the billing-driven state again.
 */
export async function setAdminOverride(parentId: string, override: boolean | null): Promise<void> {
  await db
    .insert(subscription)
    .values({ parentId, adminOverride: override })
    .onConflictDoUpdate({
      target: subscription.parentId,
      set: { adminOverride: override, updatedAt: new Date() },
    });
}

/** Create or update the parent's single entitlement row. */
export async function upsertEntitlementRow(parentId: string, patch: EntitlementPatch): Promise<void> {
  const set = {
    status: patch.status,
    productId: patch.productId ?? null,
    source: patch.source,
    currentPeriodEnd: patch.currentPeriodEnd ?? null,
    updatedAt: new Date(),
  };
  await db
    .insert(subscription)
    .values({ parentId, ...set })
    .onConflictDoUpdate({ target: subscription.parentId, set });
}
