// scripts/smoke.ts
//
// Post-deploy smoke test (issue #51). A fast, dependency-free "is this deployment
// alive?" check that hits a RUNNING deployment by URL and asserts the handful of
// public surfaces that prove the app is healthy. It is deliberately SEPARATE from
// the Playwright E2E suite (issue #41):
//
//   - E2E drives a real browser through authenticated journeys against a seeded
//     database. It needs a browser binary, a DB, and test accounts.
//   - Smoke is plain HTTP: `fetch` against any base URL, no browser, no database,
//     no secrets, no login. It answers one question in a couple of seconds: did
//     the deployment boot and are its public routes serving?
//
// Why a Node script and not Playwright here: this is the LIGHTER tool for the job.
// Node 24's global `fetch` needs no dependency, and skipping the browser means CI
// runs it without `playwright install` (no ~200MB browser download). tsx is
// already a devDependency (used by db:apply), so `npm run smoke` adds nothing.
//
// Target URL: SMOKE_URL, else BASE_URL, else localhost. In CI the deploy workflow
// passes the Vercel preview/production URL. Any check failing exits non-zero so a
// broken build is never promoted.
//
//   SMOKE_URL=https://staging.bedtimequests.com npm run smoke

const BASE_URL = (process.env.SMOKE_URL ?? process.env.BASE_URL ?? "http://localhost:3000").replace(/\/+$/, "");

// Per-request timeout, and a few retries so a cold serverless deploy warming up
// does not flake the whole run.
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_ATTEMPTS = 4;
const RETRY_DELAY_MS = 3_000;

type Check = {
  name: string;
  path: string;
  // Throw (or return a string reason) to fail; return void/true to pass.
  assert: (res: Response, body: string) => void | Promise<void>;
};

function expectStatus(res: Response, expected: number) {
  if (res.status !== expected) {
    throw new Error(`expected HTTP ${expected}, got ${res.status}`);
  }
}

function expectIncludes(body: string, needle: string) {
  if (!body.includes(needle)) {
    throw new Error(`response body did not contain ${JSON.stringify(needle)}`);
  }
}

const checks: Check[] = [
  {
    // Health endpoint (app/api/health/route.ts): the cheapest liveness signal.
    name: "health endpoint responds ok",
    path: "/api/health",
    assert: (res, body) => {
      expectStatus(res, 200);
      const json = JSON.parse(body) as { status?: string };
      if (json.status !== "ok") throw new Error(`health status was ${JSON.stringify(json.status)}, expected "ok"`);
    },
  },
  {
    // Home. Signed out, proxy.ts redirects "/" to /sign-in; fetch follows the
    // redirect, so a healthy app still resolves to a 200 that renders the brand.
    name: "home page resolves and renders",
    path: "/",
    assert: (res, body) => {
      expectStatus(res, 200);
      expectIncludes(body, "Bedtime Quests");
    },
  },
  {
    name: "sign-in page loads",
    path: "/sign-in",
    assert: (res, body) => {
      expectStatus(res, 200);
      expectIncludes(body, "Bedtime Quests");
    },
  },
  {
    // Critical auth surface: BetterAuth's built-in health route. A 200 { ok: true }
    // means the auth handler mounted and is serving (issue #51 requirement).
    name: "auth handler responds",
    path: "/api/auth/ok",
    assert: (res, body) => {
      expectStatus(res, 200);
      const json = JSON.parse(body) as { ok?: boolean };
      if (json.ok !== true) throw new Error(`auth /ok returned ${body}`);
    },
  },
  {
    name: "privacy policy loads",
    path: "/privacy",
    assert: (res, body) => {
      expectStatus(res, 200);
      expectIncludes(body, "Privacy Policy");
    },
  },
  {
    name: "terms of service loads",
    path: "/terms",
    assert: (res, body) => {
      expectStatus(res, 200);
      expectIncludes(body, "Terms");
    },
  },
  {
    name: "robots.txt resolves",
    path: "/robots.txt",
    assert: (res, body) => {
      expectStatus(res, 200);
      expectIncludes(body, "Sitemap");
    },
  },
  {
    name: "sitemap.xml resolves",
    path: "/sitemap.xml",
    assert: (res, body) => {
      expectStatus(res, 200);
      expectIncludes(body, "<urlset");
    },
  },
];

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { redirect: "follow", signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function runCheck(check: Check): Promise<string | null> {
  const url = `${BASE_URL}${check.path}`;
  let lastError = "unknown error";
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetchWithTimeout(url);
      const body = await res.text();
      await check.assert(res, body);
      return null; // passed
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      if (attempt < MAX_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      }
    }
  }
  return lastError;
}

async function main() {
  console.log(`Smoke testing ${BASE_URL}\n`);
  let failed = 0;
  for (const check of checks) {
    const error = await runCheck(check);
    if (error) {
      failed++;
      console.log(`  FAIL  ${check.name} (${check.path}) -> ${error}`);
    } else {
      console.log(`  PASS  ${check.name} (${check.path})`);
    }
  }

  console.log("");
  if (failed > 0) {
    console.error(`Smoke test FAILED: ${failed} of ${checks.length} checks failed against ${BASE_URL}`);
    process.exit(1);
  }
  console.log(`Smoke test passed: all ${checks.length} checks green against ${BASE_URL}`);
}

main().catch((err) => {
  console.error("Smoke test crashed:", err);
  process.exit(1);
});
