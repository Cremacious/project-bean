import { defineConfig, devices } from "@playwright/test";

// End-to-end tests (issue #41). These are kept fully separate from the Vitest unit
// suite: unit tests live next to the code and run with `npm run test`; E2E tests
// live in `e2e/` and run a real browser against a running app with `npm run test:e2e`.
//
// How the app + database are provided (see e2e/README.md for the full story):
//  - Locally, `webServer` starts `next dev`, which loads `.env.local` and talks to
//    the dev Neon database over the usual neon-http driver. No secret is read here.
//  - In CI, the workflow sets DB_DRIVER=pg + a localhost DATABASE_URL pointing at a
//    throwaway Postgres service container, so no real Neon endpoint or secret is
//    needed. `global-setup.ts` migrates and seeds that fresh database.
// Either way, billing, ads, analytics, and error reporting no-op because their keys
// are absent, so the critical journeys run without any third-party secrets.

const PORT = 3000;
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./e2e",
  // Serial: the journeys share one app + one database and a handful of auth
  // endpoints that are rate limited, so running them one at a time keeps the run
  // deterministic and well under the auth limits.
  fullyParallel: false,
  workers: 1,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: isCI ? [["list"], ["html", { open: "never" }]] : [["list"]],
  globalSetup: "./e2e/global-setup.ts",

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    video: "retain-on-failure",
  },

  projects: [
    // Creates the shared parent account + child and saves a signed-in storage state
    // that the authenticated journeys reuse. Runs first as a dependency.
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
  ],

  webServer: {
    // `next dev` is enough for E2E and boots faster than a production build; it
    // inherits DATABASE_URL / DB_DRIVER / auth env from the shell (CI) or loads
    // `.env.local` (local dev).
    command: "npm run dev",
    url: `${BASE_URL}/sign-in`,
    reuseExistingServer: !isCI,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
