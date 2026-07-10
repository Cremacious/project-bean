import { describe, it, expect, vi, beforeEach } from "vitest";
import * as session from "@/lib/session";
import * as entitlements from "@/lib/entitlements";
import * as store from "@/lib/entitlement-store";
import { startSubscription } from "./subscribe-actions";
import type { Subscription } from "@/lib/entitlements";

// The action reads the parent and their subscription; mock both. The store is
// mocked too so we can assert the action never writes an entitlement (no faked
// purchase on the web).
vi.mock("@/lib/session", () => ({ getParent: vi.fn() }));
vi.mock("@/lib/entitlements", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/entitlements")>();
  return { ...actual, getSubscription: vi.fn() };
});
vi.mock("@/lib/entitlement-store", () => ({
  getEntitlementRow: vi.fn(),
  upsertEntitlementRow: vi.fn(),
}));

const getParent = vi.mocked(session.getParent);
const getSubscription = vi.mocked(entitlements.getSubscription);
const upsert = vi.mocked(store.upsertEntitlementRow);

const parent = { id: "parent_1", name: "Pat", email: "pat@example.com" };
const notSubscribed: Subscription = {
  status: "none",
  productId: null,
  source: "internal",
  currentPeriodEnd: null,
  isActive: false,
};

beforeEach(() => vi.clearAllMocks());

describe("startSubscription", () => {
  it("requires a signed in parent", async () => {
    getParent.mockResolvedValue(null);
    expect(await startSubscription("yearly")).toEqual({ ok: false, reason: "unauthenticated" });
    expect(getSubscription).not.toHaveBeenCalled();
  });

  it("rejects an unknown plan key", async () => {
    getParent.mockResolvedValue(parent);
    expect(await startSubscription("weekly")).toEqual({ ok: false, reason: "invalid_plan" });
  });

  it("has nothing to sell to an already entitled parent (paid or trial)", async () => {
    getParent.mockResolvedValue(parent);
    getSubscription.mockResolvedValue({ ...notSubscribed, status: "trialing", isActive: true });
    expect(await startSubscription("monthly")).toEqual({ ok: false, reason: "already_subscribed" });
  });

  it("defers a valid start to the native app without granting entitlement", async () => {
    getParent.mockResolvedValue(parent);
    getSubscription.mockResolvedValue(notSubscribed);

    const result = await startSubscription("yearly");

    expect(result).toEqual({ ok: true, outcome: "deferred_to_native", planKey: "yearly" });
    // The web path must never fake a purchase: no entitlement is written.
    expect(upsert).not.toHaveBeenCalled();
  });
});
