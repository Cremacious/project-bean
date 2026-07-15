// lib/health.ts
//
// Health-probe logic for the liveness + readiness endpoints (issue #75). It lives
// in lib/ (not in the route) for two reasons: the app/ directory is not in the
// vitest include set but lib/ is, so this is where the branching logic can be unit
// tested; and it keeps app/api/health/route.ts a thin adapter.
//
// Two probes, deliberately different in cost and meaning:
//   - Liveness  (GET /api/health): "the Next server is serving." No dependencies,
//     always 200 while the process is up. This is what an uptime monitor polls on
//     a tight interval; a red liveness means the app itself is down.
//   - Readiness (GET /api/health?deep=1): liveness PLUS a cheap `select 1` against
//     Postgres, so a monitor (or a human) can tell "app up but database
//     unreachable" apart from "app down". It is an opt-in query flag so the default
//     probe never pays the DB round-trip and can never be reddened by a flaky
//     dependency — keeping the basic liveness check fast and always-on.
//
// Both responses are secret-free and status-code-driven: no connection strings, no
// driver error text, just a tiny JSON shape and the HTTP status. The readiness
// probe returns 503 (not 500) when the DB is unreachable, so a monitor keying on
// the status code reads it as "temporarily unavailable" rather than a code fault.

/** Overall health verdict. `degraded` = liveness ok but a dependency check failed. */
export type HealthState = "ok" | "degraded";

/** Result of the single dependency we probe today. Never carries an error message. */
export type DbCheck = "ok" | "error";

export type LivenessBody = {
  status: "ok";
  // Vercel build metadata (all undefined off-Vercel, e.g. local dev). Non-secret.
  env: string | null;
  commit: string | null;
  branch: string | null;
  time: string;
};

export type ReadinessBody = {
  status: HealthState;
  checks: { db: DbCheck };
  env: string | null;
  commit: string | null;
  branch: string | null;
  time: string;
};

/** A trimmed non-empty string, or null. Keeps "missing" and "blank" identical. */
function clean(value: string | undefined): string | null {
  const v = value?.trim();
  return v ? v : null;
}

/** Non-personal build identity shared by both probe bodies (sourced from Vercel). */
function buildInfo(env: NodeJS.ProcessEnv) {
  return {
    env: clean(env.VERCEL_ENV) ?? clean(env.NODE_ENV),
    commit: clean(env.VERCEL_GIT_COMMIT_SHA),
    branch: clean(env.VERCEL_GIT_COMMIT_REF),
  };
}

/** The liveness body: status ok plus non-secret build metadata. Pure. */
export function buildLivenessBody(
  env: NodeJS.ProcessEnv = process.env,
  now: Date = new Date(),
): LivenessBody {
  return { status: "ok", ...buildInfo(env), time: now.toISOString() };
}

/**
 * Run a dependency probe with a hard timeout, collapsing every outcome to a plain
 * "ok" | "error". It NEVER rejects and NEVER surfaces the underlying error (which
 * could name a host or connection string), so the readiness route stays leak-free:
 *   - probe resolves            -> "ok"
 *   - probe rejects             -> "error"
 *   - probe hangs past timeout  -> "error" (a hung DB must not hang the monitor)
 */
export async function runDbProbe(
  probe: () => Promise<unknown>,
  timeoutMs = 3000,
): Promise<DbCheck> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const timedOut = new Promise<DbCheck>((resolve) => {
      timer = setTimeout(() => resolve("error"), timeoutMs);
    });
    const ran = probe().then(
      () => "ok" as const,
      () => "error" as const,
    );
    return await Promise.race([ran, timedOut]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Turn a dependency-check result into the readiness HTTP status + body. 200 when
 * every dependency is ok, 503 (degraded) otherwise. Pure and secret-free.
 */
export function buildReadiness(
  db: DbCheck,
  env: NodeJS.ProcessEnv = process.env,
  now: Date = new Date(),
): { status: number; body: ReadinessBody } {
  const state: HealthState = db === "ok" ? "ok" : "degraded";
  return {
    status: db === "ok" ? 200 : 503,
    body: { status: state, checks: { db }, ...buildInfo(env), time: now.toISOString() },
  };
}
