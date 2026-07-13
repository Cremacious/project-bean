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

## Pre-deploy checklist

- [ ] `package-lock.json` in sync (`npm ci` succeeds — this was fixed in #42).
- [ ] Node 24.x selected in Vercel + pinned in `package.json`.
- [ ] Four required vars set for Production and Preview (with distinct values).
- [ ] `DATABASE_URL` uses the **pooled** Neon string.
- [ ] `BETTER_AUTH_URL` / `NEXT_PUBLIC_APP_URL` match each environment's origin.
- [ ] OAuth redirect URIs registered for the Production domain (if social login is on).
- [ ] Custom domain attached with `www` / `.app` redirecting to `bedtimequests.com` and TLS valid (§7).
- [ ] Production schema applied via **`docs/DATABASE.md`** (#45) before relying on data-backed pages.
