# End-to-end tests (Playwright)

These exercise the critical user journeys in a real browser. They are separate from
the Vitest unit suite: unit tests live next to the code and run with `npm run test`;
these E2E tests live here in `e2e/` and run with `npm run test:e2e`.

## Journeys covered

| Spec                 | Journey                                                                                  |
| -------------------- | ---------------------------------------------------------------------------------------- |
| `signup.spec.ts`     | Sign up a new parent (no parental gate on sign-up), then add the first child and reach the library. |
| `signin.spec.ts`     | Sign in an existing parent and pick a child on the "Who stars tonight" screen.           |
| `read-story.spec.ts` | Read a free story from start to a good ending, making choices, with the child's name personalized and the ending screen shown. |
| `paywall.spec.ts`    | A free-tier parent hits the paywall (#34) on a premium story.                             |

`auth.setup.ts` runs first and saves a signed-in browser state (a shared parent +
child) that the authenticated journeys reuse, so they never repeat sign-in and stay
under the auth rate limits. `global-setup.ts` prepares the database once.

## Running locally

```bash
npm run test:e2e          # headless
npm run test:e2e:ui       # interactive UI mode
```

Locally the app runs via `next dev`, which loads `.env.local` and talks to the dev
Neon database over the usual `neon-http` driver. No secret is read by the tests. The
suite creates its own test accounts (unique emails) and reads the already-seeded
story catalog, so it never touches meaningful data. If your dev database has no
stories yet, run `npm run db:seed` once.

Billing, ads, analytics, and error reporting all no-op when their keys are absent,
so the journeys run without any third-party secrets.

## How it runs in CI

E2E is a **separate `e2e` job** in `.github/workflows/ci.yml`, running on the same
triggers as the rest of CI (every push to `master` and every pull request). It uses
a throwaway Postgres **service container** instead of Neon:

- `DB_DRIVER=pg` switches `db/client.ts` to the `node-postgres` driver, so the app
  talks to the local Postgres. No Neon endpoint or secret is needed.
- `global-setup.ts` applies the Drizzle migrations and seeds the story catalog into
  that empty database (this only happens in the `pg` path; locally it is a no-op).
- The auth secret is a non-secret placeholder, matching the existing `verify` job.

No production data is ever involved, and `.env.local` is never read.
