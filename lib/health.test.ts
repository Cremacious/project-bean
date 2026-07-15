// lib/health.test.ts
//
// Unit tests for the health-probe logic (issue #75). We test the pure builders and
// the timeout/error collapsing of runDbProbe here; the route in
// app/api/health/route.ts is a thin adapter that only wires the real DB probe in,
// and app/ is outside the vitest include set by design.

import { describe, it, expect } from "vitest";
import {
  buildLivenessBody,
  buildReadiness,
  runDbProbe,
} from "./health";

const FIXED = new Date("2026-07-15T00:00:00.000Z");

describe("buildLivenessBody", () => {
  it("reports ok with non-secret build metadata from Vercel env", () => {
    const body = buildLivenessBody(
      {
        VERCEL_ENV: "production",
        VERCEL_GIT_COMMIT_SHA: "abc123",
        VERCEL_GIT_COMMIT_REF: "master",
      } as NodeJS.ProcessEnv,
      FIXED,
    );
    expect(body).toEqual({
      status: "ok",
      env: "production",
      commit: "abc123",
      branch: "master",
      time: "2026-07-15T00:00:00.000Z",
    });
  });

  it("falls back to NODE_ENV and nulls when Vercel metadata is absent (local dev)", () => {
    const body = buildLivenessBody({ NODE_ENV: "development" } as NodeJS.ProcessEnv, FIXED);
    expect(body).toMatchObject({ status: "ok", env: "development", commit: null, branch: null });
  });

  it("never carries anything but whitelisted keys (no secret leakage)", () => {
    const body = buildLivenessBody(
      { DATABASE_URL: "postgres://secret", BETTER_AUTH_SECRET: "shh" } as NodeJS.ProcessEnv,
      FIXED,
    );
    expect(Object.keys(body).sort()).toEqual(["branch", "commit", "env", "status", "time"]);
    expect(JSON.stringify(body)).not.toContain("secret");
  });
});

describe("buildReadiness", () => {
  const env = { VERCEL_ENV: "production" } as NodeJS.ProcessEnv;

  it("returns 200 ok when the db check passes", () => {
    const { status, body } = buildReadiness("ok", env, FIXED);
    expect(status).toBe(200);
    expect(body).toMatchObject({ status: "ok", checks: { db: "ok" }, env: "production" });
  });

  it("returns 503 degraded when the db check fails", () => {
    const { status, body } = buildReadiness("error", env, FIXED);
    expect(status).toBe(503);
    expect(body).toMatchObject({ status: "degraded", checks: { db: "error" } });
  });

  it("never includes a driver message, only the ok/error verdict", () => {
    const { body } = buildReadiness("error", env, FIXED);
    expect(JSON.stringify(body)).not.toMatch(/connect|ECONNREFUSED|password|host/i);
  });
});

describe("runDbProbe", () => {
  it("resolves 'ok' when the probe succeeds", async () => {
    await expect(runDbProbe(async () => 1)).resolves.toBe("ok");
  });

  it("resolves 'error' (never throws) when the probe rejects", async () => {
    await expect(
      runDbProbe(async () => {
        throw new Error("connect ECONNREFUSED 10.0.0.1:5432");
      }),
    ).resolves.toBe("error");
  });

  it("resolves 'error' when the probe hangs past the timeout", async () => {
    const hang = () => new Promise<unknown>(() => {}); // never settles
    await expect(runDbProbe(hang, 20)).resolves.toBe("error");
  });

  it("prefers a fast success over the timeout", async () => {
    await expect(
      runDbProbe(() => new Promise((r) => setTimeout(() => r("ok"), 5)), 1000),
    ).resolves.toBe("ok");
  });
});
