import { describe, it, expect, vi, beforeEach } from "vitest";
import * as store from "@/lib/entitlement-store";
import {
  getSubscription,
  isSubscribed,
  computeIsActive,
  grantInternalEntitlement,
} from "./entitlements";

vi.mock("@/lib/entitlement-store", () => ({
  getEntitlementRow: vi.fn(),
  upsertEntitlementRow: vi.fn(),
}));

const getRow = vi.mocked(store.getEntitlementRow);
const upsert = vi.mocked(store.upsertEntitlementRow);

const parent = { id: "parent_1", name: "Pat", email: "pat@example.com" };

beforeEach(() => vi.clearAllMocks());

describe("getSubscription / isSubscribed", () => {
  it("reports an active subscription", async () => {
    getRow.mockResolvedValue({
      parentId: "parent_1", status: "active", productId: "monthly",
      source: "revenuecat", currentPeriodEnd: null,
    });
    const sub = await getSubscription(parent);
    expect(sub.isActive).toBe(true);
    expect(sub.status).toBe("active");
    expect(sub.source).toBe("revenuecat");
    expect(await isSubscribed(parent)).toBe(true);
  });

  it("counts an active trial as subscribed", async () => {
    getRow.mockResolvedValue({
      parentId: "parent_1", status: "trialing", productId: "monthly",
      source: "revenuecat", currentPeriodEnd: new Date(Date.now() + 86_400_000),
    });
    expect(await isSubscribed(parent)).toBe(true);
  });

  it("treats a parent with no row as not subscribed", async () => {
    getRow.mockResolvedValue(null);
    expect(await isSubscribed(parent)).toBe(false);
    expect((await getSubscription(parent)).status).toBe("none");
  });

  it("treats an entitlement past its period end as not subscribed", async () => {
    getRow.mockResolvedValue({
      parentId: "parent_1", status: "active", productId: "monthly",
      source: "revenuecat", currentPeriodEnd: new Date(1000),
    });
    expect(await isSubscribed(parent)).toBe(false);
  });

  it("fails safe to not subscribed when the store throws (never rejects)", async () => {
    getRow.mockRejectedValue(new Error("db down"));
    await expect(isSubscribed(parent)).resolves.toBe(false);
    await expect(getSubscription(parent)).resolves.toMatchObject({ status: "none", isActive: false });
  });

  it("is not subscribed for a null parent and never hits the store", async () => {
    expect(await isSubscribed(null)).toBe(false);
    expect(getRow).not.toHaveBeenCalled();
  });

  it("normalizes an unknown persisted status to not subscribed", async () => {
    getRow.mockResolvedValue({
      parentId: "parent_1", status: "banana", productId: null,
      source: "internal", currentPeriodEnd: null,
    });
    expect(await isSubscribed(parent)).toBe(false);
  });
});

describe("grantInternalEntitlement", () => {
  it("writes an active internal entitlement so gating can be exercised today", async () => {
    await grantInternalEntitlement("parent_1", { productId: "comp" });
    expect(upsert).toHaveBeenCalledWith("parent_1", {
      status: "active", productId: "comp", source: "internal", currentPeriodEnd: null,
    });
  });
});

describe("computeIsActive", () => {
  const now = new Date("2026-07-10T00:00:00Z");
  it("is active for active/trialing with no or future expiry", () => {
    expect(computeIsActive("active", null, now)).toBe(true);
    expect(computeIsActive("trialing", new Date("2026-08-01"), now)).toBe(true);
  });
  it("keeps a canceled subscription active until its period end", () => {
    expect(computeIsActive("canceled", new Date("2026-08-01"), now)).toBe(true);
    expect(computeIsActive("canceled", new Date("2026-01-01"), now)).toBe(false);
  });
  it("is inactive for none/expired or a past period end", () => {
    expect(computeIsActive("none", null, now)).toBe(false);
    expect(computeIsActive("expired", null, now)).toBe(false);
    expect(computeIsActive("active", new Date("2026-01-01"), now)).toBe(false);
  });
});
