import { describe, it, expect, vi } from "vitest";
import {
  getReportingConfig,
  isReportingEnabled,
  scrubEvent,
  captureError,
  buildSentryOptions,
  type ReportingConfig,
  type ReportingEvent,
} from "./reporting";

/** A config with reporting on, for exercising captureError without env coupling. */
const ENABLED: ReportingConfig = {
  enabled: true,
  dsn: "https://public@o0.ingest.sentry.io/1",
  environment: "production",
  release: undefined,
};
const DISABLED: ReportingConfig = { ...ENABLED, enabled: false };

describe("getReportingConfig", () => {
  it("is disabled with no DSN (clean local dev / CI)", () => {
    const config = getReportingConfig({});
    expect(config.enabled).toBe(false);
    expect(config.dsn).toBeNull();
    expect(isReportingEnabled({})).toBe(false);
  });

  it("enables from just the DSN (kill switch defaults on)", () => {
    const config = getReportingConfig({ NEXT_PUBLIC_SENTRY_DSN: "https://k@o0.ingest.sentry.io/1" });
    expect(config.enabled).toBe(true);
    expect(config.dsn).toBe("https://k@o0.ingest.sentry.io/1");
  });

  it("treats a blank DSN the same as missing", () => {
    const config = getReportingConfig({ NEXT_PUBLIC_SENTRY_DSN: "   " });
    expect(config.dsn).toBeNull();
    expect(config.enabled).toBe(false);
  });

  it("kill switch off disables even when a DSN is present", () => {
    const base = { NEXT_PUBLIC_SENTRY_DSN: "https://k@o0.ingest.sentry.io/1" };
    expect(getReportingConfig({ ...base, NEXT_PUBLIC_SENTRY_ENABLED: "false" }).enabled).toBe(false);
    expect(getReportingConfig({ ...base, NEXT_PUBLIC_SENTRY_ENABLED: "0" }).enabled).toBe(false);
    // anything else falls back to on
    expect(getReportingConfig({ ...base, NEXT_PUBLIC_SENTRY_ENABLED: "true" }).enabled).toBe(true);
    expect(getReportingConfig({ ...base, NEXT_PUBLIC_SENTRY_ENABLED: "yes" }).enabled).toBe(true);
  });

  it("tags the environment (NODE_ENV by default, explicit override wins)", () => {
    expect(getReportingConfig({ NODE_ENV: "production" }).environment).toBe("production");
    expect(getReportingConfig({}).environment).toBe("development");
    expect(
      getReportingConfig({ NODE_ENV: "production", NEXT_PUBLIC_SENTRY_ENVIRONMENT: "staging" }).environment,
    ).toBe("staging");
  });

  it("reads an optional release and leaves it undefined when unset", () => {
    expect(getReportingConfig({}).release).toBeUndefined();
    expect(getReportingConfig({ NEXT_PUBLIC_SENTRY_RELEASE: "v1.2.3" }).release).toBe("v1.2.3");
  });
});

describe("scrubEvent", () => {
  it("keeps a non-identifying opaque user id but drops email/ip/username", () => {
    const out = scrubEvent({
      user: { id: "opaque-abc123", email: "mom@example.com", ip_address: "1.2.3.4", username: "mom" },
    });
    expect(out?.user).toEqual({ id: "opaque-abc123" });
  });

  it("drops the whole user object when the id itself is an email", () => {
    const out = scrubEvent({ user: { id: "mom@example.com" } });
    expect(out?.user).toBeUndefined();
  });

  it("strips request body, cookies, query string, and the url query", () => {
    const out = scrubEvent({
      request: {
        url: "https://app.example.com/story/bean-woods?name=Ada&child=Ada",
        query_string: "name=Ada",
        data: { name: "Ada" },
        cookies: "session=abc",
        headers: { cookie: "session=abc", "user-agent": "test" },
        method: "POST",
      },
    });
    expect(out?.request?.data).toBeUndefined();
    expect(out?.request?.cookies).toBeUndefined();
    expect(out?.request?.query_string).toBeUndefined();
    expect(out?.request?.url).toBe("https://app.example.com/story/bean-woods");
    expect(out?.request?.method).toBe("POST"); // route + method kept for debugging
    // the personal "cookie" header is dropped; a benign header survives
    expect(out?.request?.headers).toEqual({ "user-agent": "test" });
  });

  it("drops personal-looking keys from extra, tags, and contexts", () => {
    const out = scrubEvent({
      extra: { story: "bean-woods", childName: "Ada", parentEmail: "mom@example.com", userId: "u1" },
      tags: { route: "/story", sessionId: "sess_abc" },
      contexts: { profile: { child_name: "Ada", age_band: "2-4" } },
    });
    expect(out?.extra).toEqual({ story: "bean-woods" });
    expect(out?.tags).toEqual({ route: "/story" });
    expect(out?.contexts).toEqual({ profile: { age_band: "2-4" } });
  });

  it("redacts email-shaped substrings in the message and exception values", () => {
    const out = scrubEvent({
      message: "failed to email mom@example.com",
      exception: { values: [{ type: "Error", value: "contact parent at dad@example.com now" }] },
    });
    expect(out?.message).toBe("failed to email [redacted]");
    expect(out?.exception?.values?.[0].value).toBe("contact parent at [redacted] now");
  });

  it("strips query strings from breadcrumb urls and drops personal breadcrumb data", () => {
    const out = scrubEvent({
      breadcrumbs: [{ category: "navigation", data: { from: "/a?name=Ada", to: "/b?x=1", childName: "Ada" } }],
    });
    expect(out?.breadcrumbs?.[0].data).toEqual({ from: "/a", to: "/b" });
  });

  it("COMPLIANCE: an event carrying the child name and parent email leaves with neither", () => {
    const event: ReportingEvent = {
      user: { id: "mom@example.com", username: "Ada" },
      request: {
        url: "https://app/story/x?name=Ada",
        data: { childName: "Ada" },
        cookies: "session=1",
      },
      extra: { childName: "Ada", parentEmail: "mom@example.com" },
      message: "render failed for mom@example.com",
    };
    const json = JSON.stringify(scrubEvent(event));
    expect(json).not.toContain("Ada");
    expect(json).not.toContain("mom@example.com");
    expect(json).not.toContain("session=1");
  });

  it("never throws; returns the event", () => {
    expect(() => scrubEvent({})).not.toThrow();
    expect(scrubEvent({ message: "plain error" })?.message).toBe("plain error");
  });
});

describe("captureError", () => {
  it("forwards the error to the transport when enabled", () => {
    const transport = vi.fn();
    const err = new Error("boom");
    captureError(err, { config: ENABLED, transport });
    expect(transport).toHaveBeenCalledTimes(1);
    expect(transport).toHaveBeenCalledWith(err);
  });

  it("no-ops when reporting is disabled (transport never called)", () => {
    const transport = vi.fn();
    captureError(new Error("boom"), { config: DISABLED, transport });
    expect(transport).not.toHaveBeenCalled();
  });

  it("never throws even if the transport throws", () => {
    const transport = vi.fn(() => {
      throw new Error("transport down");
    });
    expect(() => captureError(new Error("boom"), { config: ENABLED, transport })).not.toThrow();
  });

  it("swallows a rejected async transport", async () => {
    const transport = vi.fn(() => Promise.reject(new Error("async down")));
    expect(() => captureError(new Error("boom"), { config: ENABLED, transport })).not.toThrow();
    await Promise.resolve();
  });
});

describe("buildSentryOptions", () => {
  it("turns PII off, tracing off, and wires the scrubber as beforeSend", () => {
    const opts = buildSentryOptions(ENABLED);
    expect(opts.sendDefaultPii).toBe(false);
    expect(opts.tracesSampleRate).toBe(0);
    expect(opts.beforeSend).toBe(scrubEvent);
    expect(opts.dsn).toBe(ENABLED.dsn);
    expect(opts.environment).toBe("production");
    // No replay/tracing integrations are configured.
    expect(opts.integrations).toBeUndefined();
  });
});
