# Deploying Bedtime Quests to Vercel

Runbook for issue #42. Gets `Cremacious/project-bean` deployable on Vercel with
working Preview and Production deployments. Schema/migrations and backups on Neon
are handled separately in **`docs/DATABASE.md`** (#45) — there is a known
`db:migrate` hang against neon-http, so we do NOT run migrations from the deploy.

`.env.example` is the single source of truth for every variable. This file maps
those variables to Vercel scopes and gives the click-by-click setup.

## 1. Environment variable inventory

Compiled from the code (every `process.env.*` read), grouped by area. "Scope" is
the Vercel environment(s) the value belongs in.

### Required (build/runtime fails or auth breaks without them)

| Variable | Purpose | Scope | Notes |
| --- | --- | --- | --- |
| `DATABASE_URL` | Neon Postgres connection (`db/client.ts`, `drizzle.config.ts`). App throws at import if unset. | Production, Preview, Development | Use the **pooled** Neon string (host has `-pooler`). Prod and Preview should point at different Neon branches. |
| `BETTER_AUTH_SECRET` | BetterAuth session signing + the `active_child` cookie HMAC. | Production, Preview, Development | Generate with `openssl rand -base64 32`. Use a distinct value per environment. |
| `BETTER_AUTH_URL` | Server-side auth base URL. | Production, Preview, Development | **Must differ per env.** Production = `https://YOUR_DOMAIN`; Preview = the preview origin (see §4). |
| `NEXT_PUBLIC_APP_URL` | Browser auth client base URL (`lib/auth-client.ts`). Inlined at build. | Production, Preview, Development | Same origin as `BETTER_AUTH_URL` for that environment. |

### Optional — social login (a provider activates only when its keys are present)

| Variable | Purpose | Scope | Notes |
| --- | --- | --- | --- |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth (`lib/auth.ts`). | Production (+ stable preview domain only) | Register redirect URI `https://YOUR_DOMAIN/api/auth/callback/google`. |
| `APPLE_CLIENT_ID` | Apple Services ID, e.g. `app.bedtimequests.web`. | Production | Return URL `https://YOUR_DOMAIN/api/auth/callback/apple` (Apple rejects http/localhost). |
| `APPLE_TEAM_ID` / `APPLE_KEY_ID` / `APPLE_PRIVATE_KEY` | Inputs the app signs into Apple's client-secret JWT. | Production | `APPLE_PRIVATE_KEY` is the whole `.p8` on one line with newlines as `\n`. |
| `APPLE_CLIENT_SECRET` | Pre-generated Apple JWT (alternative to the four values above). | Production | Optional; if set it is used as-is. |

> Preview URLs on Vercel are unique per deployment, so pre-registered OAuth
> redirect URIs won't match them. Keep Google/Apple keys in **Production** (or a
> stable preview alias whose exact callback URL you register). Test Preview with
> email/password.

### Optional — email, billing, admin

| Variable | Purpose | Scope | Notes |
| --- | --- | --- | --- |
| `RESEND_API_KEY` / `EMAIL_FROM` | Transactional email for password reset (`lib/email/send.ts`). Both unset → emails are logged, not sent. | Production (+ Preview if testing reset) | `EMAIL_FROM` must be a Resend-verified sender. |
| `REVENUECAT_WEBHOOK_AUTH_TOKEN` | Shared secret for the RevenueCat webhook (`lib/revenuecat.ts`). Unset → webhook returns 503 (fail-safe). | Production | Web does not sell subs yet; needed when native ships (M6). |
| `ADMIN_EMAILS` | Comma-separated allowlist for `/admin` (`lib/admin.ts`). | Production (+ Preview if you admin there) | Empty → nobody is admin. |

### Optional — ads, analytics, reporting (all default OFF when their key is absent)

| Variable | Purpose | Scope | Notes |
| --- | --- | --- | --- |
| `ADS_ENABLED` | Global ad kill switch; ads OFF unless exactly `true`/`1`. | Production | Absent = off. |
| `NEXT_PUBLIC_ADS_NETWORK` | `house` (default) / `superawesome` / `google-gam`. | Production | House ads need no unit id. |
| `NEXT_PUBLIC_SUPERAWESOME_PLACEMENT_ID` / `NEXT_PUBLIC_GOOGLE_AD_UNIT_ID` | Third-party ad unit ids. | Production | Missing/blank → that network stays off. |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | GA4 id; the analytics ON switch (`lib/analytics.ts`). | Production | Unset → no analytics code loads. |
| `NEXT_PUBLIC_ANALYTICS_ENABLED` | Analytics kill switch (defaults on when id present). | Production | Set `false`/`0` to disable. |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN; the reporting ON switch (`lib/reporting.ts`). | Production | Public by design; unset → no reporting. |
| `NEXT_PUBLIC_SENTRY_ENABLED` | Reporting kill switch (defaults on when DSN present). | Production | — |
| `NEXT_PUBLIC_SENTRY_ENVIRONMENT` | Tag prod vs preview errors. Defaults to `NODE_ENV`. | Production, Preview | e.g. `production` / `preview`. |
| `NEXT_PUBLIC_SENTRY_RELEASE` | Optional release tag for grouping. | Production | Source-map upload intentionally not wired, so no `SENTRY_AUTH_TOKEN` is needed. |

### Do NOT set on Vercel

- `DB_DRIVER` — test-only switch (`=pg`) for CI/E2E against throwaway Postgres. On
  Vercel leave it unset so the Neon HTTP driver is used.
- `NODE_ENV` — Vercel sets this automatically.

> **`NEXT_PUBLIC_*` are build-time inlined.** Changing any `NEXT_PUBLIC_*` value
> requires a **redeploy**, not just a settings save.

## 2. Create the Vercel project

1. In Vercel: **Add New… → Project**, import the GitHub repo **`Cremacious/project-bean`** (authorize the GitHub app if prompted).
2. **Framework Preset:** Next.js (auto-detected). **Root Directory:** `./` (repo root). **Build Command / Output:** leave as the Next.js defaults — do not override.
3. **Node.js version:** set to **24.x** (Settings → General → Node.js Version) to match CI (#40). The repo also pins `"engines": { "node": "24.x" }` in `package.json`, so this is belt-and-suspenders.
4. Do **not** deploy yet — add the env vars first (§3).

No `vercel.json` is required: the Next.js preset covers build, output, functions, and routing. The Neon HTTP driver works from any region, so no custom function region is needed.

## 3. Add environment variables

Settings → **Environment Variables**. For each var in §1, add the value and tick
the scope(s) shown. Start with the four required vars, then add optional
integrations as you turn them on.

- Add **Production** and **Preview** values separately for `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL` (Preview must not reuse Production's secret, URL, or database branch).
- For local dev, keep values in `.env.local` (gitignored) — do not add a Development scope in Vercel unless you use `vercel dev`.

## 4. Preview vs Production URLs

`BETTER_AUTH_URL` / `NEXT_PUBLIC_APP_URL` must match the origin the browser is on,
or auth cookies and callbacks break:

- **Production:** your custom domain, e.g. `https://bedtimequests.com` (set this after the domain is attached; until then use the `*.vercel.app` production alias).
- **Preview:** the stable per-branch alias if you use one, otherwise the deployment URL. Because these vary, treat social login as Production-only and verify Preview with email/password.

## 5. Point at Neon

1. In Neon, create/choose a **branch for production** (schema comes later in #45; an empty branch is fine to wire now). Use a **separate branch for preview** so preview traffic never touches prod data.
2. Copy the **pooled** connection string (Neon dashboard → Connect → "Pooled connection"; the host contains `-pooler`). Serverless functions open many short-lived connections, so the pooler is required to avoid exhausting direct connections.
3. Set `DATABASE_URL` to that pooled string in the matching Vercel scope. Keep `?sslmode=require`.

> Migrations are covered in **`docs/DATABASE.md`** (#45). `npm run db:migrate`
> hangs against neon-http; apply the production schema out-of-band with
> `npm run db:apply` per that doc. Deploy only wires `DATABASE_URL`.

## 6. Deploy and verify

Trigger a deploy (push to `master` for Production, or open a PR for Preview). Then:

1. **Boots:** the deployment URL loads the home page (no 500).
2. **Sign in:** create an account / sign in with email+password; you land in the app.
3. **Read a story:** open a story and reach an ending.
4. If anything 500s, check Vercel → Deployment → **Runtime Logs**; a missing required var or an unmigrated database (#45) is the usual cause.

## 7. Custom domain and HTTPS (#43)

Canonical production site: **`https://bedtimequests.com`** (apex). `www.bedtimequests.com`,
`bedtimequests.app`, and `www.bedtimequests.app` all **308-redirect** to it, so auth
cookies, OAuth callbacks, and canonical/OpenGraph links stay on one origin. TLS,
http→https, and the host redirects are handled by Vercel; there is intentionally no
middleware or `next.config` `redirects()` for this.

### 7a. Add the domains in Vercel

Settings → **Domains → Add**:

1. `bedtimequests.com` → **serve** (primary/canonical).
2. `www.bedtimequests.com` → **Redirect to `bedtimequests.com`** (308).
3. `bedtimequests.app` → **Redirect to `bedtimequests.com`**.
4. `www.bedtimequests.app` → **Redirect to `bedtimequests.com`**.

Vercel shows the exact DNS record per domain — those values are authoritative if they
differ from the table below.

### 7b. DNS records at the registrar

| Host / Name | Type | Value | Purpose |
| --- | --- | --- | --- |
| `@` (bedtimequests.com) | `A` | `76.76.21.21` | apex canonical |
| `www` (bedtimequests.com) | `CNAME` | `cname.vercel-dns.com` | www → redirect |
| `@` (bedtimequests.app) | `A` | `76.76.21.21` | .app apex → redirect |
| `www` (bedtimequests.app) | `CNAME` | `cname.vercel-dns.com` | .app www → redirect |

- Apex uses an A record because many registrars can't CNAME the bare domain — that is why the apex was chosen as canonical.
- `.app` is HSTS-preloaded (HTTPS-only); Vercel serves it over HTTPS. Do not serve it over http.
- Remove stale A/AAAA/parking records on these hosts so they don't conflict.

Verify propagation and TLS:

```bash
nslookup bedtimequests.com
curl -sI https://bedtimequests.com                  # 200 + valid cert
curl -sI http://bedtimequests.com     | grep -i location   # 308 → https://bedtimequests.com/
curl -sI https://www.bedtimequests.com | grep -i location  # 308 → apex
curl -sI https://bedtimequests.app     | grep -i location  # 308 → apex
```

### 7c. App config for the production origin

- Set **Production** `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` to `https://bedtimequests.com`
  (no trailing slash, no `http`, no `localhost`), then **redeploy** — `NEXT_PUBLIC_APP_URL`
  is build-time inlined and also drives `metadataBase` in `app/layout.tsx`.
- Register OAuth redirect URLs on the canonical domain (only the canonical host is needed,
  since every other host redirects to it first):
  - Google (Cloud Console → the Web OAuth client): redirect URI
    `https://bedtimequests.com/api/auth/callback/google`; JS origin `https://bedtimequests.com`.
  - Apple (Developer portal → Services ID → Sign in with Apple → Configure): domain
    `bedtimequests.com`; return URL `https://bedtimequests.com/api/auth/callback/apple`.
    Apple requires HTTPS on a real domain and may ask you to host its domain-association
    file under `/.well-known/`.

### 7d. Verify end to end

`https://bedtimequests.com` loads with a valid cert; the http / www / both `.app` hosts
308-redirect to it; email+password sign-in works; Google and Apple sign-in complete on the
canonical domain.

## 8. Staging environment (#51)

Staging is a **pre-production** environment that is a faithful copy of production
(same build, same schema) but with its **own database and its own third-party
config**, so you can verify a release on a real URL before it ever touches the
production domain or production data.

### 8a. How staging maps to Vercel (recommended: a `staging` branch → Preview)

Vercel already builds every branch as a **Preview** deployment (§4). The simplest
reliable staging is to make one long-lived branch the staging channel and pin a
stable domain to it, rather than standing up a second Vercel project:

1. Create a long-lived branch once: `git branch staging master && git push -u origin staging`.
   (Staging is a channel you keep; it is not a throwaway PR branch.)
2. Vercel → the project → **Settings → Domains → Add** `staging.bedtimequests.com`,
   and assign it to the **`staging` git branch** (Vercel lets you point a domain at a
   specific branch's latest Preview deploy). Add the DNS `CNAME staging → cname.vercel-dns.com`
   at the registrar (same pattern as §7b).
3. Now every push to `staging` deploys to a **stable URL** (`https://staging.bedtimequests.com`),
   which is what makes it usable for OAuth callbacks and repeatable smoke runs
   (ordinary per-PR preview URLs change every deploy, so they can't).

Why this over a separate Vercel project: one project keeps build settings, the repo
link, and env management in a single place; a dedicated branch + domain already gives
full runtime isolation. Only reach for a second Vercel project if you later need
different build settings or access controls for staging. (A plain per-PR Preview
deploy is fine for ad-hoc checks, but staging wants a *stable* URL, hence the branch.)

### 8b. A SEPARATE database for staging (Neon branch)

Staging must **never** read or write production data. Use a dedicated **Neon branch**
off production (Neon Console → Branches → **New branch** from the prod branch, name it
`staging`). A branch is a copy-on-write clone: it starts with prod's schema (and data
as of branch time) but diverges independently, so staging experiments and test signups
never touch prod. Copy its **pooled** connection string (host contains `-pooler`) for
`DATABASE_URL`. (A fully separate Neon *project* also works and is more isolated, but a
branch is cheaper, instant, and enough here — see `docs/DATABASE.md` §2.2.)

### 8c. Staging env vars (what MUST differ from production)

Set these on Vercel scoped to **Preview**, targeted to the **`staging` branch** where
Vercel supports per-branch values (Environment Variables → add value → Git Branch =
`staging`). The four required vars must all differ from production:

| Variable | Staging value | Why it must differ |
| --- | --- | --- |
| `DATABASE_URL` | the **Neon `staging` branch** pooled string | never point staging at prod data (§8b). |
| `BETTER_AUTH_URL` | `https://staging.bedtimequests.com` | auth cookies/callbacks must match the staging origin. |
| `NEXT_PUBLIC_APP_URL` | `https://staging.bedtimequests.com` | build-time inlined origin (canonical/OG, auth client). Redeploy after changing. |
| `BETTER_AUTH_SECRET` | a **distinct** `openssl rand -base64 32` | staging sessions must not be signable with the prod secret. |

Third-party integrations in staging should be **test/sandbox mode or simply absent**
(each one no-ops cleanly when its key is unset — that is the whole design in §1):

- **OAuth (Google/Apple):** simplest is to leave `GOOGLE_*` / `APPLE_*` **unset** in
  staging and verify with email/password (same guidance as Preview, §4). If you do want
  social login on staging, add `https://staging.bedtimequests.com/api/auth/callback/google`
  (and the Apple return URL) to the existing OAuth clients' allowed redirects.
- **Analytics (`NEXT_PUBLIC_GA_MEASUREMENT_ID`):** leave **unset** so staging traffic
  never pollutes prod analytics (or use a separate test GA property).
- **Error reporting (`NEXT_PUBLIC_SENTRY_DSN`):** leave unset, **or** keep it and set
  `NEXT_PUBLIC_SENTRY_ENVIRONMENT=staging` so staging errors are tagged apart from prod.
- **Ads (`ADS_ENABLED`):** leave unset/`false` — no ads in staging.
- **Billing (`REVENUECAT_WEBHOOK_AUTH_TOKEN`):** leave unset (webhook returns 503); the
  web app sells nothing today, so there is nothing to test here until native (M6).
- **Email (`RESEND_API_KEY` / `EMAIL_FROM`):** leave unset so reset emails are logged,
  not sent — unless you are specifically testing the reset flow with a test sender.
- **`ADMIN_EMAILS`:** set to your email only if you need `/admin` on staging.
- **`CSP_MODE`:** staging is the right place to try `enforce` before turning it on in
  production (§ proxy.ts rollout note).

### 8d. Applying schema to the staging DB

Follow `docs/DATABASE.md`, **not** `npm run db:migrate` (it hangs on neon-http). Because
the Neon `staging` branch is forked from prod, it already carries prod's schema at fork
time; to bring it up to a newer migration, set `DATABASE_URL` to the staging branch string
**in your shell for that one command** and run:

```bash
npm run db:apply           # applies pending journal migrations over neon-http
npm run db:apply -- --check   # dry-run: show ledger-vs-journal without applying
```

This is exactly the "rehearse on a Neon branch" step in `docs/DATABASE.md` §1.1.4, so
staging doubles as the migration rehearsal before you apply the same migration to prod.
Do not print, echo, or commit any connection string.

## 9. Smoke tests (#51)

`npm run smoke` runs a small, fast HTTP check suite (`scripts/smoke.ts`) against a
**running** deployment to confirm it is healthy. It is intentionally separate from the
Playwright E2E suite (#41): E2E drives a browser through authenticated journeys against a
seeded DB, while smoke is plain `fetch` over public routes — no browser, no database, no
secrets, no login. It answers one question in a couple of seconds: *did this deployment
boot and are its public surfaces serving?*

It targets `SMOKE_URL` (falls back to `BASE_URL`, then `http://localhost:3000`) and asserts:

- `GET /api/health` → `200 { status: "ok" }` (a secret-free liveness route added for this;
  uptime monitoring in #75 can poll the same URL),
- `/` (home) resolves and renders, `/sign-in` loads,
- `GET /api/auth/ok` → `200 { ok: true }` (the BetterAuth handler is mounted),
- `/privacy`, `/terms`, `/robots.txt`, and `/sitemap.xml` all resolve.

Run it against any environment:

```bash
npm run smoke                                                   # local (start the app first)
SMOKE_URL=https://staging.bedtimequests.com npm run smoke      # staging
SMOKE_URL=https://bedtimequests.com npm run smoke              # production spot-check
```

Any failing check exits non-zero. **In CI it runs automatically:** `.github/workflows/smoke.yml`
listens for Vercel's `deployment_status` event and runs `npm run smoke` against every
successful Preview/Production deployment's real URL. It needs no secrets (public routes
only), so it never blocks on config that staging or a fork lacks.

## 10. Promote path: staging verified → production

The rule: **never promote a build to the production domain until smoke is green on
staging.** The release flow:

1. Merge the change to `master` and push the same commit to `staging`
   (`git push origin master:staging`), which deploys to `https://staging.bedtimequests.com`.
2. If the change needs a schema migration, apply it to the **staging** Neon branch first
   (§8d) — this is the rehearsal.
3. Wait for the staging smoke run to go green (Actions → **Smoke**, or run
   `SMOKE_URL=https://staging.bedtimequests.com npm run smoke` locally). Do a quick manual
   pass of anything smoke can't see (a real sign-in, reading a story) if the change warrants.
4. Only then apply the migration to **production** (`docs/DATABASE.md` §1.1) if there is one.
5. Promote to production — push `master` (production auto-deploys), **or** in Vercel →
   Deployments, **Promote** the already-built staging deployment to Production so the exact
   artifact you smoke-tested is what ships.
6. Spot-check production: `SMOKE_URL=https://bedtimequests.com npm run smoke` (the Smoke
   workflow also runs automatically on the production deploy). If it is red, roll back
   immediately via Vercel → Deployments → **Promote** the previous good build
   (`docs/DATABASE.md` §2.4 step 1).

## Pre-deploy checklist

- [ ] `package-lock.json` in sync (`npm ci` succeeds — this was fixed in #42).
- [ ] Node 24.x selected in Vercel + pinned in `package.json`.
- [ ] Four required vars set for Production and Preview (with distinct values).
- [ ] `DATABASE_URL` uses the **pooled** Neon string.
- [ ] `BETTER_AUTH_URL` / `NEXT_PUBLIC_APP_URL` match each environment's origin.
- [ ] OAuth redirect URIs registered for the Production domain (if social login is on).
- [ ] Custom domain attached with `www` / `.app` redirecting to `bedtimequests.com` and TLS valid (§7).
- [ ] Production schema applied via **`docs/DATABASE.md`** (#45) before relying on data-backed pages.
