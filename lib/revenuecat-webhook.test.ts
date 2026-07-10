import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as store from "@/lib/entitlement-store";
import { POST } from "@/app/api/revenuecat/webhook/route";

// The webhook writes through the store; mock it so no database is required.
vi.mock("@/lib/entitlement-store", () => ({
  getEntitlementRow: vi.fn(),
  upsertEntitlementRow: vi.fn(),
}));
const upsert = vi.mocked(store.upsertEntitlementRow);

function post(headers: Record<string, string>, body: unknown): Request {
  return new Request("http://localhost/api/revenuecat/webhook", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.unstubAllEnvs());

describe("RevenueCat webhook POST", () => {
  it("returns 503 when no webhook token is configured", async () => {
    vi.stubEnv("REVENUECAT_WEBHOOK_AUTH_TOKEN", "");
    const res = await POST(post({ authorization: "x" }, { event: {} }));
    expect(res.status).toBe(503);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("returns 401 for a bad Authorization header", async () => {
    vi.stubEnv("REVENUECAT_WEBHOOK_AUTH_TOKEN", "s3cret");
    const res = await POST(post({ authorization: "wrong" }, { event: {} }));
    expect(res.status).toBe(401);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("persists a mapped entitlement for an authorized event", async () => {
    vi.stubEnv("REVENUECAT_WEBHOOK_AUTH_TOKEN", "s3cret");
    const res = await POST(
      post(
        { authorization: "s3cret", "content-type": "application/json" },
        {
          event: {
            type: "INITIAL_PURCHASE", app_user_id: "parent_1",
            product_id: "monthly", period_type: "NORMAL", expiration_at_ms: 1_893_456_000_000,
          },
        },
      ),
    );
    expect(res.status).toBe(200);
    expect(upsert).toHaveBeenCalledWith(
      "parent_1",
      expect.objectContaining({ status: "active", source: "revenuecat", productId: "monthly" }),
    );
  });

  it("acknowledges (200) an event it cannot map, without writing", async () => {
    vi.stubEnv("REVENUECAT_WEBHOOK_AUTH_TOKEN", "s3cret");
    const res = await POST(post({ authorization: "s3cret" }, { event: { type: "TEST", app_user_id: "p" } }));
    expect(res.status).toBe(200);
    expect(upsert).not.toHaveBeenCalled();
  });
});
