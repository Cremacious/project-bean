import { describe, it, expect, vi, beforeEach } from "vitest";
import * as store from "@/lib/entitlement-store";
import type { EntitlementRow, EntitlementPatch } from "@/lib/entitlement-store";
import { mapEventToEntitlement, type RevenueCatEvent } from "@/lib/revenuecat";
import { getSubscription } from "@/lib/entitlements";
import { PLANS } from "@/lib/plans";

// Entitlement after a successful purchase, end to end through the #33 abstraction.
// The billing provider is mocked entirely: we feed the webhook mapping a
// RevenueCat event (as if a purchase or trial completed in the native app), write
// it through an in memory store, and read it back the same way the app does. No
// real payment API is touched.
vi.mock("@/lib/entitlement-store", () => ({
  getEntitlementRow: vi.fn(),
  upsertEntitlementRow: vi.fn(),
}));

const getRow = vi.mocked(store.getEntitlementRow);
const upsert = vi.mocked(store.upsertEntitlementRow);

const parent = { id: "parent_1", name: "Pat", email: "pat@example.com" };
const FUTURE = Date.now() + 30 * 86_400_000;

// Back the mocked store with a Map keyed by parent id so a write is readable.
function useInMemoryStore() {
  const rows = new Map<string, EntitlementRow>();
  upsert.mockImplementation(async (parentId: string, patch: EntitlementPatch) => {
    rows.set(parentId, {
      parentId,
      status: patch.status,
      productId: patch.productId ?? null,
      source: patch.source,
      currentPeriodEnd: patch.currentPeriodEnd ?? null,
    });
  });
  getRow.mockImplementation(async (parentId: string) => rows.get(parentId) ?? null);
}

// Persist a provider event the way the webhook route does.
async function applyProviderEvent(event: RevenueCatEvent) {
  const mapped = mapEventToEntitlement(event);
  if (!mapped) return;
  await store.upsertEntitlementRow(mapped.appUserId, {
    status: mapped.status,
    productId: mapped.productId,
    source: "revenuecat",
    currentPeriodEnd: mapped.currentPeriodEnd,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  useInMemoryStore();
});

describe("entitlement after a successful subscription", () => {
  it("starts as not subscribed before any purchase", async () => {
    expect((await getSubscription(parent)).isActive).toBe(false);
  });

  it("grants premium when a free trial starts (trial counts as subscribed)", async () => {
    await applyProviderEvent({
      type: "INITIAL_PURCHASE",
      app_user_id: parent.id,
      product_id: PLANS.yearly.productId,
      period_type: "TRIAL",
      expiration_at_ms: FUTURE,
    });

    const sub = await getSubscription(parent);
    expect(sub.status).toBe("trialing");
    expect(sub.isActive).toBe(true);
    expect(sub.source).toBe("revenuecat");
    expect(sub.productId).toBe(PLANS.yearly.productId);
  });

  it("grants premium on a paid purchase", async () => {
    await applyProviderEvent({
      type: "INITIAL_PURCHASE",
      app_user_id: parent.id,
      product_id: PLANS.monthly.productId,
      period_type: "NORMAL",
      expiration_at_ms: FUTURE,
    });

    const sub = await getSubscription(parent);
    expect(sub.status).toBe("active");
    expect(sub.isActive).toBe(true);
  });

  it("keeps premium after a trial converts to paid", async () => {
    await applyProviderEvent({
      type: "INITIAL_PURCHASE",
      app_user_id: parent.id,
      product_id: PLANS.yearly.productId,
      period_type: "TRIAL",
      expiration_at_ms: Date.now() + 7 * 86_400_000,
    });
    await applyProviderEvent({
      type: "RENEWAL",
      app_user_id: parent.id,
      product_id: PLANS.yearly.productId,
      period_type: "NORMAL",
      expiration_at_ms: FUTURE,
    });

    const sub = await getSubscription(parent);
    expect(sub.status).toBe("active");
    expect(sub.isActive).toBe(true);
  });

  it("revokes premium once the subscription expires", async () => {
    await applyProviderEvent({
      type: "INITIAL_PURCHASE",
      app_user_id: parent.id,
      product_id: PLANS.monthly.productId,
      period_type: "NORMAL",
      expiration_at_ms: FUTURE,
    });
    expect((await getSubscription(parent)).isActive).toBe(true);

    await applyProviderEvent({
      type: "EXPIRATION",
      app_user_id: parent.id,
      product_id: PLANS.monthly.productId,
      expiration_at_ms: Date.now() - 1000,
    });
    expect((await getSubscription(parent)).isActive).toBe(false);
  });
});
