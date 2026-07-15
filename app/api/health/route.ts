// app/api/health/route.ts
//
// Deployment health check (issues #51, #75). A tiny, public, secret-free endpoint
// that the smoke suite (scripts/smoke.ts) and any uptime monitor can poll to
// confirm a running deployment is alive. Two modes, both status-code-driven:
//
//   GET /api/health          Liveness. Does NOT touch the database or any third
//                            party: it stays green whenever the Next server itself
//                            is serving, so a red liveness means "the app is down",
//                            not "a dependency is flaky". Poll this on a tight
//                            interval.
//   GET /api/health?deep=1   Readiness. Liveness PLUS a cheap `select 1` against
//                            Postgres so a monitor can tell "app up but DB
//                            unreachable" (503, degraded) apart from "app down".
//                            Opt-in so the basic probe never pays the DB round-trip.
//
// Neither response reveals a connection string, key, or user data (see lib/health.ts
// for the leak-free shaping and the driver-error swallowing).
//
// Public: /api/health is allowlisted in proxy.ts so a signed-out probe reaches it
// instead of being redirected to /sign-in. `force-dynamic` + `no-store` guarantee
// every hit reflects the live deployment rather than a cached/prerendered value.
import { buildLivenessBody, buildReadiness, runDbProbe } from "@/lib/health";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" } as const;

/**
 * The default DB probe. The db client and drizzle helpers are imported LAZILY,
 * only on the ?deep=1 path, so the liveness probe never loads db/client.ts (which
 * throws at import when DATABASE_URL is unset) and stays truly dependency-light.
 */
async function probeDatabase(): Promise<void> {
  const [{ db }, { sql }] = await Promise.all([
    import("@/db/client"),
    import("drizzle-orm"),
  ]);
  await db.execute(sql`select 1`);
}

export async function GET(request: Request): Promise<Response> {
  const deep = new URL(request.url).searchParams.get("deep");
  const wantsDeep = deep === "1" || deep === "true";

  if (!wantsDeep) {
    return Response.json(buildLivenessBody(), { status: 200, headers: NO_STORE });
  }

  const db = await runDbProbe(probeDatabase);
  const { status, body } = buildReadiness(db);
  return Response.json(body, { status, headers: NO_STORE });
}
