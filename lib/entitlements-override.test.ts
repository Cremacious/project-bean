import { describe, it, expect, vi, beforeEach } from "vitest";
import * as store from "@/lib/entitlement-store";
import { getSubscription, isSubscribed } from "./entitlements";

// The admin premium override (issue #85) is applied inside getSubscription on top
// of the billing-driven computation. Mock the persistence seam and assert the
// override wins in both directions, and that null defers to billing.
vi.mock("@/lib/entitlement-store", () => ({
  getEntitlementRow: vi.fn(),
  upsertEntitlementRow: vi.fn(),
  setAdminOverride: vi.fn(),
}));

const getRow = vi.mocked(store.getEntitlementRow);
const parent = { id: "parent_1", email: "pat@example.com" };
const FUTURE = new Date(Date.now() + 30 * 86_400_000);

beforeEach(() => vi.clearAllMocks());

describe("admin premium override in getSubscription", () => {
  it("forces premium ON even with no billing entitlement", async () => {
    getRow.mockResolvedValue({
      parentId: parent.id, status: "none", productId: null,
      source: "internal", currentPeriodEnd: null, adminOverride: true,
    });
    expect(await isSubscribed(parent)).toBe(true);
    expect((await getSubscription(parent)).isActive).toBe(true);
  });

  it("forces premium OFF even with an active paid subscription", async () => {
    getRow.mockResolvedValue({
      parentId: parent.id, status: "active", productId: "monthly",
      source: "revenuecat", currentPeriodEnd: FUTURE, adminOverride: false,
    });
    expect(await isSubscribed(parent)).toBe(false);
  });

  it("defers to billing when the override is null", async () => {
    getRow.mockResolvedValue({
      parentId: parent.id, status: "active", productId: "monthly",
      source: "revenuecat", currentPeriodEnd: FUTURE, adminOverride: null,
    });
    expect(await isSubscribed(parent)).toBe(true);
  });

  it("defers to billing when the override is absent (undefined)", async () => {
    getRow.mockResolvedValue({
      parentId: parent.id, status: "expired", productId: null,
      source: "internal", currentPeriodEnd: null,
    });
    expect(await isSubscribed(parent)).toBe(false);
  });
});
