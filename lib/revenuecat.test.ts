import { describe, it, expect, afterEach, vi } from "vitest";
import {
  webhookAuthToken,
  isRevenueCatConfigured,
  verifyWebhookAuth,
  mapEventToEntitlement,
} from "./revenuecat";

afterEach(() => vi.unstubAllEnvs());

describe("webhook auth", () => {
  it("is unconfigured and rejects everything when the token is unset (fail-safe)", () => {
    vi.stubEnv("REVENUECAT_WEBHOOK_AUTH_TOKEN", "");
    expect(webhookAuthToken()).toBeUndefined();
    expect(isRevenueCatConfigured()).toBe(false);
    expect(verifyWebhookAuth("anything")).toBe(false);
  });

  it("accepts a header that matches the configured token", () => {
    vi.stubEnv("REVENUECAT_WEBHOOK_AUTH_TOKEN", "s3cret-token");
    expect(isRevenueCatConfigured()).toBe(true);
    expect(verifyWebhookAuth("s3cret-token")).toBe(true);
  });

  it("rejects a mismatched, wrong-length, or missing header", () => {
    vi.stubEnv("REVENUECAT_WEBHOOK_AUTH_TOKEN", "s3cret-token");
    expect(verifyWebhookAuth("wrong")).toBe(false);
    expect(verifyWebhookAuth("s3cret-token-longer")).toBe(false);
    expect(verifyWebhookAuth(null)).toBe(false);
    expect(verifyWebhookAuth(undefined)).toBe(false);
  });
});

describe("mapEventToEntitlement", () => {
  const exp = 1_893_456_000_000; // fixed ms, avoids time flakiness

  it("maps a normal initial purchase to active with its period end", () => {
    expect(
      mapEventToEntitlement({
        type: "INITIAL_PURCHASE", app_user_id: "parent_1",
        product_id: "monthly", period_type: "NORMAL", expiration_at_ms: exp,
      }),
    ).toEqual({
      appUserId: "parent_1", status: "active", productId: "monthly",
      currentPeriodEnd: new Date(exp),
    });
  });

  it("maps a trial period to trialing", () => {
    expect(
      mapEventToEntitlement({
        type: "INITIAL_PURCHASE", app_user_id: "p", period_type: "TRIAL", expiration_at_ms: exp,
      })?.status,
    ).toBe("trialing");
  });

  it("maps EXPIRATION to expired", () => {
    expect(mapEventToEntitlement({ type: "EXPIRATION", app_user_id: "p", expiration_at_ms: 100 })?.status).toBe("expired");
  });

  it("maps CANCELLATION to canceled (still entitled until period end)", () => {
    expect(
      mapEventToEntitlement({ type: "CANCELLATION", app_user_id: "p", period_type: "NORMAL", expiration_at_ms: exp })?.status,
    ).toBe("canceled");
  });

  it("ignores TEST events, aliasing, and events with no app_user_id", () => {
    expect(mapEventToEntitlement({ type: "TEST", app_user_id: "p" })).toBeNull();
    expect(mapEventToEntitlement({ type: "SUBSCRIBER_ALIAS", app_user_id: "p" })).toBeNull();
    expect(mapEventToEntitlement({ type: "INITIAL_PURCHASE" })).toBeNull();
    expect(mapEventToEntitlement(undefined)).toBeNull();
  });
});
