// app/api/health/route.ts
//
// Deployment health check (issue #51). A tiny, public, secret-free endpoint that
// the smoke suite (scripts/smoke.ts) and any uptime monitor (issue #75) can poll
// to confirm a running deployment is alive. It does NOT touch the database or any
// third party: it must stay green whenever the Next server itself is serving, so
// a red health check means "the app is down", not "a dependency is flaky".
//
// Response: 200 with { status: "ok", ... } and non-personal build info sourced
// from Vercel's own system env vars (VERCEL_* are build metadata, NOT secrets).
// Nothing here reveals a connection string, key, or user data.
//
// Public: /api/health is allowlisted in proxy.ts so a signed-out probe reaches it
// instead of being redirected to /sign-in. `force-dynamic` + `no-store` guarantee
// every hit reflects the live deployment rather than a cached/prerendered value.
export const dynamic = "force-dynamic";

export function GET(): Response {
  const body = {
    status: "ok",
    // Vercel build metadata (undefined off-Vercel, e.g. local dev). Non-secret.
    env: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? null,
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    branch: process.env.VERCEL_GIT_COMMIT_REF ?? null,
    time: new Date().toISOString(),
  };
  return Response.json(body, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}
