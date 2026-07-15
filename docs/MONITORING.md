# Uptime monitoring and alerts

Runbook for issue #75. External monitoring that checks the production site + API on
a schedule and alerts fast when something is unreachable. The monitoring account is
yours to create; this doc makes the app monitor-ready and gives you an exact,
copy-paste setup plus a short "site is down" runbook.

Related ops docs: **`docs/DEPLOYMENT.md`** (deploy, domains, staging, smoke, rollback)
and **`docs/DATABASE.md`** (Neon backups/restore, recovery runbook).

---

## 0. TL;DR

1. Create a free **UptimeRobot** account and add the five monitors in §3 (or use
   **Better Stack** — §6 — if you want faster checks and consecutive-failure logic).
2. Set alert contacts to **email + your phone** (§4), alert after **2 consecutive
   failures**.
3. Turn on **SSL-expiry** and add a **domain-expiry** reminder (§5).
4. Keep it distinct from Sentry (#39): uptime answers *is it reachable*, Sentry
   answers *did code throw* (§7).

Nothing in the app needs a secret or a new dependency for any of this.

---

## 1. What we monitor, and why two health probes

The app exposes one endpoint with two modes (`app/api/health/route.ts`, logic in
`lib/health.ts`). Both are public (allowlisted in `proxy.ts`), secret-free, and
status-code-driven — safe to hand to a third-party monitor.

| Probe | URL | Cost | Meaning | Use for |
| --- | --- | --- | --- | --- |
| **Liveness** | `/api/health` | trivial, no dependencies | The Next server is serving. Always `200 {"status":"ok"}` while the process is up. | The primary, tight-interval uptime monitor. A red liveness = **the app is down**. |
| **Readiness** | `/api/health?deep=1` | one `select 1` to Postgres | Liveness **plus** the database is reachable. `200 {"checks":{"db":"ok"}}`, or **`503` `{"status":"degraded","checks":{"db":"error"}}`** if the DB is unreachable. | A slower monitor that tells "app up, DB down" apart from "app down". |

Why split them: the liveness probe must never be reddened by a flaky dependency, so
it touches nothing. The DB check is opt-in behind `?deep=1` and has a 3s internal
timeout, so a hung database can never hang the monitor. Neither response leaks a
connection string, key, or user data — the readiness body only ever says `db: ok`
or `db: error`, never the driver's error text.

Quick manual check of both (works against prod or local):

```bash
curl -s https://bedtimequests.com/api/health            # {"status":"ok",...}
curl -s -w "\n%{http_code}\n" "https://bedtimequests.com/api/health?deep=1"  # ...200 (or 503 if DB down)
```

---

## 2. Which service to use

**Recommended: UptimeRobot** (https://uptimerobot.com) — free tier covers a small
app comfortably: 50 monitors, 5-minute checks, email/push alerts, SSL-expiry
monitoring, and public status pages. Zero cost, five-minute setup.

**Upgrade option: Better Stack (Better Uptime)** — free tier gives 10 monitors at
**3-minute** (paid: 30s) checks, multi-location verification, real
**consecutive-failure** thresholds, on-call scheduling, phone/SMS/Slack, and
incident status pages. Choose this if 5 minutes is too slow or you want it to page
your phone. Setup mirrors §3; see §6 for the deltas.

Pick **one** — running both just doubles the noise. Start on UptimeRobot; move to
Better Stack later if you outgrow it.

---

## 3. Exact monitors to create (UptimeRobot)

Create these five. For each: **Dashboard → + New monitor → HTTP(s)**, then set the
fields shown. Replace `bedtimequests.com` only if your canonical domain differs
(`docs/DEPLOYMENT.md` §7 — everything else 308-redirects to the apex, so monitor the
apex).

| # | Monitor name | Type | URL | Interval | Expect | Keyword check |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | **Bedtime Quests — liveness** | HTTP/Keyword | `https://bedtimequests.com/api/health` | **1 min** (paid) / **5 min** (free) | HTTP 200 | keyword **exists**: `"status":"ok"` |
| 2 | **Bedtime Quests — DB readiness** | HTTP/Keyword | `https://bedtimequests.com/api/health?deep=1` | 5 min | HTTP 200 | keyword **exists**: `"db":"ok"` |
| 3 | **Bedtime Quests — landing** | HTTP/Keyword | `https://bedtimequests.com/welcome` | 5 min | HTTP 200 | keyword **exists**: `Bedtime Quests` |
| 4 | **Bedtime Quests — sign-in** | HTTP/Keyword | `https://bedtimequests.com/sign-in` | 5 min | HTTP 200 | keyword **exists**: `Bedtime Quests` |
| 5 | **Bedtime Quests — SSL cert** | (see §5) | `https://bedtimequests.com` | daily | cert valid | — |

Notes:

- **Use a Keyword monitor, not plain HTTP, wherever a keyword is listed.** A plain
  ping only checks that *something* answered; the keyword confirms the app actually
  rendered (an error page or a hijacked host would still return 200 but miss the
  keyword).
- **Why `/welcome` and `/sign-in`, not the library.** The library lives at `/` and
  is auth-gated — a signed-out monitor is redirected to `/welcome`, so the public,
  always-reachable pages are the marketing landing (`/welcome`) and `/sign-in`.
  Those two are exactly what a new visitor hits, so they are the right "is the site
  usable" signals. (These are the same public surfaces the `npm run smoke` suite
  checks — see `docs/DEPLOYMENT.md` §9.)
- **Monitor #2 keys on the JSON body**, so it flips to DOWN on a `503` *or* if the
  body ever lacks `"db":"ok"`. That is the one monitor that will fire when the app
  is up but **Neon** is unreachable.
- **Follow redirects: ON** (UptimeRobot default) for #3/#4 so the apex/`www`/`.app`
  308s resolve. Monitors #1/#2 hit the apex directly and need no redirect.
- Optional: also add `https://staging.bedtimequests.com/api/health` if you want the
  staging channel (`docs/DEPLOYMENT.md` §8) watched — but keep its alerts on email
  only so staging blips never page you.

---

## 4. Alerting — be told fast, without noise

**Alert contacts (UptimeRobot → My Settings → Add Alert Contact):**

1. **Email** — always on. Primary channel.
2. **Mobile push** — install the UptimeRobot app and add it as a contact; this is
   the fastest free "wake me up" path.
3. Optional: **SMS** (paid credits), **Slack** (add an Incoming Webhook as a
   Slack alert contact), or a webhook to anywhere you watch.

Attach every contact to all five monitors (each monitor → **Edit → Alert Contacts To
Notify → select all**).

**Failure threshold — avoid flapping.** A single failed check is often just a cold
serverless start or a transient network blip, not an outage.

- **UptimeRobot free:** it re-checks immediately before declaring DOWN, but has no
  N-consecutive setting. Practical noise control: keep the interval at 5 min so one
  transient miss self-heals before the next check, and turn OFF "notify on every
  check while down" (notify on state change only). Expect first alert within one
  interval of a real outage.
- **Better Stack / UptimeRobot Pro:** set **alert after 2 consecutive failed
  checks** and **verify from ≥2 locations** before declaring an incident. This is
  the sweet spot: ~2 intervals of confirmed failure before you're paged, so a
  single-region blip stays silent.
- Set a **recovery notification** too (all services default this on) so you know
  when it's back without watching the dashboard.

**Rough alert budget:** liveness at 1–5 min → you learn of a hard outage in
1–5 minutes; DB readiness at 5 min → a Neon outage within ~5–10 minutes.

---

## 5. SSL-certificate and domain-expiry monitoring

These are the classic "site was fine, then silently died" causes — Vercel
auto-renews TLS, but a lapsed **domain registration** or a stuck cert renewal takes
the whole site down with no code change.

- **SSL expiry (UptimeRobot):** on the apex monitor, enable **Monitor SSL /
  Certificate expiry** and set **notify 14 days before expiry**. Do this on
  `bedtimequests.com` and `bedtimequests.app` (the `.app` TLD is HSTS-preloaded and
  HTTPS-only, so a cert lapse there is fatal — `docs/DEPLOYMENT.md` §7b).
- **Domain expiry:** UptimeRobot doesn't watch WHOIS on the free tier. Two options:
  (a) enable **auto-renew** at your registrar for `bedtimequests.com` **and**
  `bedtimequests.app` and add a calendar reminder ~30 days before each renewal date;
  or (b) on Better Stack, add its built-in **domain-expiry** monitor. Do at least
  (a) regardless of which uptime service you pick.

---

## 6. If you use Better Stack instead

Same five monitors and keywords as §3, with these upgrades:

- **Check frequency:** 3 min (free) or 30s (paid) for the liveness monitor.
- **Recovery/confirmation:** set **"confirm incident after 2 checks"** and
  **verify from at least 2 regions** on each monitor — this gives you the real
  consecutive-failure threshold §4 wants.
- **On-call:** add an escalation policy (email → push → SMS/phone) so an unattended
  alert escalates instead of being missed.
- **Domain + SSL expiry:** add Better Stack's dedicated SSL and domain monitors on
  both apex domains (§5).
- **Status page:** optionally publish a public status page pointed at the liveness
  monitor.

---

## 7. How this complements Sentry (#39), not duplicates it

They answer different questions and must not be wired to overlap:

| | Uptime monitor (this doc) | Error reporting — Sentry (`lib/reporting.ts`, #39) |
| --- | --- | --- |
| Question | **Is the site reachable from the outside?** | **Did code throw while running?** |
| Trigger | HTTP timeout / non-200 / missing keyword | An exception captured in the app |
| Blind spot | A 200 page that's silently broken in logic | A total outage — a dead app throws nothing to report |
| Alert lands | Uptime service (email/push) | Sentry (its own alert rules) |

Because the app can be **up but erroring** (Sentry fires, uptime stays green) or
**down entirely** (uptime fires, Sentry is silent), you want both. Keep their alert
channels separate so an uptime page and a Sentry issue don't cross-fire — do **not**
route Sentry issue emails into the same "site down" pager path.

---

## 8. Background jobs / cron heartbeat

**None to monitor.** The web app has no server-side cron or scheduled background job
(the only scheduling in the repo is native push in `apps/mobile`, which runs
on-device, not on a server). If a cron is ever added (e.g. a Vercel Cron), give it a
**heartbeat/"push" monitor** — the job pings a monitor URL on each successful run and
the service alerts if that ping is missed — rather than an outbound HTTP check.
Until then, there is nothing here to set up.

---

## 9. On-call basics

### What each alert means

- **"liveness" DOWN (#1):** the app itself is unreachable — bad deploy, Vercel
  incident, DNS/TLS, or domain lapse. Highest priority; the site is down.
- **"DB readiness" DOWN (#2) while liveness is UP:** the app is serving but **Neon**
  is unreachable/at capacity. Reads/writes are failing even though pages may still
  paint. Check Neon first.
- **"landing"/"sign-in" DOWN (#3/#4) while liveness is UP:** a rendering/route
  problem on a specific public page (or the keyword changed) rather than a full
  outage. Check the recent deploy and Sentry.
- **SSL/domain expiry warning:** not down yet — renew now before it becomes an
  outage (§5).

### "Site is down" — first response

Work top to bottom; stop when you find the cause.

1. **Confirm it's real.** `curl -s -w "%{http_code}\n" https://bedtimequests.com/api/health`.
   If it returns `200 {"status":"ok"}`, the outage cleared or was a monitor blip —
   check the monitor's location/log before doing anything invasive.
2. **Check Vercel.** Vercel Status (https://www.vercel-status.com) for a platform
   incident, then **your project → Deployments**: did the most recent deploy fail or
   introduce the break? Runtime errors show under the deployment's **Runtime Logs**.
3. **Check the health probes.** `/api/health` (is the app process alive?) then
   `/api/health?deep=1` (is Neon reachable?). A `503 {"db":"error"}` points at the
   database, not the app.
4. **Check Neon** (if #2 fired or readiness is `degraded`): Neon status + your
   project — is the branch suspended, over connection limit, or mid-incident? See
   `docs/DATABASE.md` §2 (backups/restore) and §2.4 (recovery runbook).
5. **Check Sentry** (#39): a spike of a new error type pinpoints the throwing code
   and usually the offending deploy.
6. **Roll back if a bad deploy is the cause.** Vercel → **Deployments → Promote** the
   last known-good build (the exact flow in `docs/DEPLOYMENT.md` §10 step 6 and
   `docs/DATABASE.md` §2.4 step 1). If the bad build shipped a schema migration, also
   follow the data-recovery steps in `docs/DATABASE.md` §2.4 before/after promoting.
7. **Verify recovery.** Re-run the health checks (or `SMOKE_URL=https://bedtimequests.com npm run smoke`,
   `docs/DEPLOYMENT.md` §9) and wait for the uptime service's recovery notification.

Keep it short: most outages are a bad deploy (→ roll back, step 6) or a Neon blip
(→ step 4). The two are told apart by whether `/api/health?deep=1` is `degraded`.
