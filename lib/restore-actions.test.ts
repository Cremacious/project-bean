import { describe, it, expect, vi, beforeEach } from "vitest";
import * as session from "@/lib/session";
import * as store from "@/lib/entitlement-store";
import { restorePurchases } from "./restore-actions";

// Restore-purchases result states (issue #36). The billing provider is mocked at
// the persistence seam (entitlement-store), the same layer the RevenueCat webhook
// writes through. restorePurchases re-reads the parent's entitlement via the single
// #33 abstraction (getSubscription runs for real over the mocked store), so these
// assert the real found / not-found path a parent sees after tapping Restore.
vi.mock("@/lib/session", () => ({ getParent: vi.fn() }));
vi.mock("@/lib/entitlement-store", () => ({
  getEntitlementRow: vi.fn(),
  upsertEntitlementRow: vi.fn(),
}));

const getParent = vi.mocked(session.getParent);
const getRow = vi.mocked(store.getEntitlementRow);

const parent = { id: "parent_1", name: "Pat", email: "pat@example.com" };
const FUTURE = new Date(Date.now() + 30 * 86_400_000);
const PAST = new Date(Date.now() - 1000);

beforeEach(() => vi.clearAllMocks());

describe("restorePurchases", () => {
  it("requires a signed in parent and never touches billing when signed out", async () => {
    getParent.mockResolvedValue(null);
    const result = await restorePurchases();
    expect(result).toEqual({ ok: false, reason: "unauthenticated" });
    expect(getRow).not.toHaveBeenCalled();
  });

  it("restores premium when an active paid subscription is found", async () => {
    getParent.mockResolvedValue(parent);
    getRow.mockResolvedValue({
      parentId: parent.id,
      status: "active",
      productId: "bedtimequests_premium_monthly",
      source: "revenuecat",
      currentPeriodEnd: FUTURE,
    });
    expect(await restorePurchases()).toEqual({ ok: true, restored: true });
  });

  it("restores premium when an active free trial is found", async () => {
    getParent.mockResolvedValue(parent);
    getRow.mockResolvedValue({
      parentId: parent.id,
      status: "trialing",
      productId: "bedtimequests_premium_yearly",
      source: "revenuecat",
      currentPeriodEnd: FUTURE,
    });
    expect(await restorePurchases()).toEqual({ ok: true, restored: true });
  });

  it("finds nothing when the parent has never subscribed", async () => {
    getParent.mockResolvedValue(parent);
    getRow.mockResolvedValue(null);
    expect(await restorePurchases()).toEqual({ ok: true, restored: false });
  });

  it("finds nothing when the only entitlement has expired", async () => {
    getParent.mockResolvedValue(parent);
    getRow.mockResolvedValue({
      parentId: parent.id,
      status: "active",
      productId: "bedtimequests_premium_monthly",
      source: "revenuecat",
      currentPeriodEnd: PAST,
    });
    expect(await restorePurchases()).toEqual({ ok: true, restored: false });
  });
});
