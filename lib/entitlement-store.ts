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
    })
    .from(subscription)
    .where(eq(subscription.parentId, parentId))
    .limit(1);
  return row ?? null;
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
