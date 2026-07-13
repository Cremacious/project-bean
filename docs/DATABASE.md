# Database: production migrations, backups, and recovery

Runbook for issue #45. Covers (a) how to apply a schema change to the production
Neon database reliably, and (b) how the data is backed up and recovered.

**Stack:** Drizzle ORM + `drizzle-kit` against Neon serverless Postgres. The app
and all scripts talk to Neon through the **neon-http** driver (`db/client.ts`).

## TL;DR

- **Applying schema changes:** `npm run db:generate` (offline) → review the SQL →
  test on a Neon branch → `npm run db:apply` against production. **Never** run
  `npm run db:migrate` (it hangs — see below).
- **Migrations are a deliberate, separate step.** They are **not** run on Vercel
  deploys. You apply them by hand, before deploying code that needs them.
- **Backups:** Neon **point-in-time restore (PITR)** is the primary safety net;
  Neon **branching** is used to rehearse migrations. A periodic `pg_dump` is the
  belt-and-suspenders offline copy (needs a direct connection, not http).

---

## 0. The `db:migrate` hang (read this first)

`npm run db:migrate` (`drizzle-kit migrate`) **hangs forever** against Neon and
must not be used. `drizzle-kit`'s CLI migrator opens a websocket **session
transaction**, but our `DATABASE_URL` points at Neon's SQL-over-HTTP endpoint,
which has no such session. The command opens the migration transaction, never
commits, prints nothing, and never exits.

Everything below is built around what *does* work over neon-http.

| Command | What it does | Use it for |
| --- | --- | --- |
| `npm run db:generate` | Offline. Diffs `db/schema.ts` against the last snapshot and writes `drizzle/NNNN_*.sql` + a snapshot + a `_journal.json` entry. Touches no database. | Every schema change — this authors the migration. |
| `npm run db:apply` | Applies pending journal migrations over neon-http and writes the `drizzle.__drizzle_migrations` ledger. Idempotent. **This sidesteps the hang.** | Applying migrations to any real DB (dev, preview, prod). |
| `npm run db:push` | Diffs schema straight onto the DB with **no** migration file and **no** ledger row. Can prompt for destructive changes. | Fast local iteration only. **Not** prod. |
| `npm run db:migrate` | ❌ Hangs on neon-http. | Never. |

`npm run db:apply` runs `scripts/apply-migrations.ts`, which uses Drizzle's
**programmatic** `neon-http` migrator (`drizzle-orm/neon-http/migrator`). That
migrator sends each statement as a plain HTTP request instead of holding a
websocket session, so it completes. Run `npm run db:apply -- --check` to print
the ledger-vs-journal state without applying anything.

---

## 1. Production migration strategy

### 1.1 The standard flow (use this ~always)

1. **Edit the schema.** Change `db/schema.ts`.
2. **Generate the migration (offline).**
   ```bash
   npm run db:generate
   ```
   This writes `drizzle/NNNN_name.sql`, `drizzle/meta/NNNN_snapshot.json`, and a
   new `_journal.json` entry. **Commit these files** — they are the source of
   truth that keeps local, CI, and prod in step.
3. **Review the generated SQL by hand.** Open `drizzle/NNNN_name.sql`. Confirm it
   does what you intended and nothing destructive slipped in (dropped column,
   narrowed type, `NOT NULL` on an existing populated column without a default).
   Edit the SQL if needed — e.g. add a data backfill (see `0005_wakeful_blockbuster.sql`
   for a migration that adds a column *and* seeds it).
4. **Rehearse on a Neon branch** (see §1.4). Point `DATABASE_URL` at a branch of
   production and run `npm run db:apply` there first. This both validates the
   apply path and catches migration errors against real prod-shaped data.
5. **Apply to production.** With `DATABASE_URL` set to the production connection
   string:
   ```bash
   npm run db:apply
   ```
   The script prints the ledger before/after and fails loudly if the ledger and
   journal end up out of sync.
6. **Verify** (see §1.3 checklist), then deploy the code that depends on the new
   schema.

> Do **not** print, echo, or commit `.env.local` or any connection string while
> doing this. Set `DATABASE_URL` in your shell environment for the one command.

### 1.2 When to use which command

- **`db:generate` + `db:apply`** — the default for anything reaching production.
  It produces a reviewable SQL file and a durable ledger, so local/CI/prod all
  agree on what has been applied.
- **`db:push`** — local development only, when iterating fast on schema shape and
  you don't yet want a migration file. It writes no journal entry and no ledger
  row, so a later `db:apply` won't know about changes you pushed. Before opening a
  PR, reset your dev branch to a clean state and regenerate the migration properly
  so the committed journal is authoritative.
- **Manual `ALTER` + ledger row** — last-resort fallback only; see §1.5.

### 1.3 Keeping local, CI, and prod consistent

- The committed `drizzle/` folder (SQL files + `meta/`) **is** the shared
  contract. Every environment applies the same journal in order.
- **CI** runs against a throwaway standard Postgres with `DB_DRIVER=pg` (see
  `db/client.ts`), so it never touches Neon or prod data.
- **Prod and preview** are **separate Neon branches** with separate
  `DATABASE_URL`s (see `docs/DEPLOYMENT.md` §5). Apply a migration to each branch
  explicitly — applying to prod does not touch preview and vice versa.
- The `drizzle.__drizzle_migrations` ledger is per-database. `db:apply` only
  applies journal entries newer than the newest ledger row, so re-running it is
  safe and a no-op once everything is applied.

### 1.4 This is a deliberate step, NOT part of deploy

**Schema migrations are never applied automatically on a Vercel deploy.** The
Vercel build only wires `DATABASE_URL`; it runs no migration (and couldn't —
`db:migrate` would hang, and running DDL from a build is unsafe). The correct
order for a schema-affecting change is:

1. Merge/prepare the code, but do not rely on the new schema in prod yet.
2. **Apply the migration to prod by hand** (`npm run db:apply`) once you have
   backed up and rehearsed it.
3. **Then** deploy the code that reads/writes the new shape.

For additive changes (new nullable column / new table) this ordering is
forgiving. For anything a running old version could choke on, apply the migration
in a backward-compatible way (add first, deploy, backfill, drop later).

### 1.5 Fallback: manual `ALTER` + ledger bookkeeping

If `db:apply` ever can't run a particular statement (e.g. a one-off operation you
don't want in the journal), you can apply SQL directly over neon-http and then
record it so Drizzle's state stays consistent:

1. Run the `ALTER`/DDL over the http driver (a small `tsx` script using
   `neon(process.env.DATABASE_URL!)` and a tagged `` sql`ALTER TABLE ...` ``, or
   the Neon SQL editor).
2. Insert a bookkeeping row into `drizzle.__drizzle_migrations` (`hash`,
   `created_at`) where `created_at` equals the journal `when` value for that
   migration. The migrator gates on `max(created_at)`, not on re-hashing, so this
   keeps a future `db:apply` from retrying it.

This is fiddly and easy to get wrong — prefer the standard flow. It exists for
edge cases only.

### 1.6 Safe production migration checklist

- [ ] `npm run test` and `npm run build` pass on the code that needs the schema.
- [ ] `npm run db:generate` run; the new `drizzle/NNNN_*.sql` **read by a human**.
- [ ] SQL reviewed for destructive/locking operations; backfill added if needed.
- [ ] **Backed up first** — confirm PITR is on (§2.1) and/or take a `pg_dump` (§2.3),
      or snapshot via a Neon branch (§2.2).
- [ ] **Rehearsed on a Neon branch** of prod with `npm run db:apply` — it succeeded.
- [ ] `npm run db:apply -- --check` against prod shows the expected pending count.
- [ ] `DATABASE_URL` set to **production**; `npm run db:apply` run; ledger matches
      journal (the script confirms this).
- [ ] Verified: affected pages/queries work; no runtime errors in Vercel logs.
- [ ] Migration files committed (`drizzle/**`), so CI and teammates stay in sync.

---

## 2. Backups and recovery

Neon is the primary backup mechanism; a periodic `pg_dump` is the independent
offline copy. Which Neon features you have depends on your **plan** — verify in
the console rather than assuming (§2.1).

### 2.1 Neon point-in-time restore (PITR)

Neon continuously retains write-ahead log history, letting you restore the branch
to any moment inside the **history-retention window** (length depends on plan —
short on Free, longer on paid). This is the main "undo a bad migration or a bad
delete" tool.

**Verify it's enabled / see the window:**

1. Neon Console → your project → **Settings → Storage** (a.k.a. History retention).
   Confirm the retention period is non-zero and note how far back it reaches. Raise
   it if the window is shorter than you're comfortable with.
2. Console → **Branches** → the production branch shows the earliest restorable
   time. Anything inside that window is recoverable.

**Restore (two safe options):**

- **Rewind the branch in place** — Console → Branches → production → **Restore**,
  pick a timestamp just *before* the bad change. Neon keeps the pre-restore state
  as a backup branch so the restore itself is reversible. Fastest for "the whole
  branch went bad".
- **Restore into a new branch first (preferred for surgery)** — create a branch
  *as of* the target timestamp (§2.2), inspect/extract the good data there, then
  either promote it or copy rows back into prod. Non-destructive: prod keeps
  serving while you work.

Use PITR + branching from the console; there is no http-driver command for it.

### 2.2 Neon branching (rehearsal + snapshots)

A Neon branch is a copy-on-write clone of the database at a point in time —
near-instant and cheap. Two uses here:

- **Rehearse a migration.** Console → Branches → **New branch** from production
  (defaults to "now"). Copy that branch's connection string, set it as
  `DATABASE_URL`, and run `npm run db:apply`. If it breaks, delete the branch;
  prod was never touched. This is step §1.1.4 above.
- **Point-in-time snapshot.** Create a branch **as of** a past timestamp to get a
  readable copy of the data as it was then — the extraction half of a PITR.

Keep prod and preview on **separate** branches (see `docs/DEPLOYMENT.md`) so
preview traffic and migration rehearsals never hit prod data.

### 2.3 Belt-and-suspenders: periodic `pg_dump`

Neon's own history is the fast path, but keep an independent logical backup in
case a whole Neon project/account is lost or you want a portable copy.

**Cadence:** weekly while pre-launch and low-traffic; move to daily once real user
data lands. Keep the last several dumps.

**Connection:** `pg_dump` needs a **direct** session connection — it will **not**
work over the http endpoint used by the app. Use Neon's **unpooled** connection
string (the host **without** `-pooler`, i.e. the "Direct connection" in the Neon
Connect dialog), not the pooled `DATABASE_URL` the app uses.

```bash
# Run from a machine with psql/pg_dump (NOT from the neon-http app runtime).
# Use the DIRECT (unpooled) Neon connection string; do not commit it or paste it
# into the repo. A compressed custom-format dump restores fastest.
pg_dump "postgresql://USER:PASSWORD@HOST/DB?sslmode=require" \
  --format=custom --no-owner --no-privileges \
  --file="bedtimequests-$(date +%Y%m%d).dump"
```

**Where to store:** off Neon and out of the repo — a private cloud bucket
(e.g. an S3/R2 bucket or a private, access-controlled drive). The dump contains
real user data (COPPA-relevant — see `docs/COMPLIANCE-COPPA.md`), so treat it as
sensitive: encrypted at rest, access-restricted, and pruned on a retention
schedule. Never commit a dump to git.

**Restore a dump** (into a fresh branch/DB first, never straight over prod):

```bash
# Restore into a clean, empty target (e.g. a new Neon branch's direct URL).
pg_restore --no-owner --no-privileges --clean --if-exists \
  --dbname="postgresql://USER:PASSWORD@TARGET_HOST/DB?sslmode=require" \
  bedtimequests-YYYYMMDD.dump
```

Automating this later (a scheduled GitHub Action or cron on a small box holding
the direct URL as a secret) is a reasonable follow-up; the manual cadence above is
enough while traffic is low.

### 2.4 Recovery runbook — "data is lost or a bad migration shipped"

1. **Stop the bleeding.** If a bad migration or code path is actively corrupting
   data, take the affected surface offline first: roll back the Vercel deployment
   to the last good build (Vercel → Deployments → **Promote** a previous one) so
   no more writes land on the broken schema.
2. **Pinpoint the moment.** Identify the timestamp just *before* the bad
   migration/deletion (deploy time, migration run time, or incident report time).
3. **Extract a good copy — non-destructively.** Create a Neon branch **as of** that
   timestamp (§2.2). Inspect it to confirm the data is intact there.
4. **Choose the smallest safe fix:**
   - *Whole DB is bad* → PITR-rewind the prod branch to the good timestamp (§2.1),
     accepting the loss of writes after that point, or promote the good branch.
   - *One table/rows are bad* → copy just the affected rows from the good branch
     back into prod (dump that table from the branch, restore into prod). Leaves
     unrelated newer writes intact.
   - *Only a schema change is bad* → write and apply a corrective forward
     migration (`db:generate` a fix, `db:apply`). Postgres has no automatic "down"
     migration here; you fix forward.
5. **If Neon history is exhausted** (change older than the retention window):
   restore the latest `pg_dump` (§2.3) into a fresh branch, extract what you need,
   and reconcile into prod.
6. **Verify.** Run the app against the recovered DB; confirm the affected
   pages/queries are correct and the ledger matches the journal
   (`npm run db:apply -- --check`).
7. **Backfill the gap.** Reconcile anything lost between the restore point and now
   (re-run idempotent jobs, ask users to redo recent actions, etc.).
8. **Write it up.** Note the cause (usually a skipped review or missing backup on a
   destructive migration) and tighten the §1.6 checklist so it can't recur.

---

## Related docs

- `docs/DEPLOYMENT.md` — Vercel + Neon wiring, pooled vs direct connection strings,
  prod/preview branch separation. Migrations are deliberately out of the deploy.
- `docs/COMPLIANCE-COPPA.md` — why dumps of user data are sensitive.
- `db/client.ts` — the neon-http driver (and the `DB_DRIVER=pg` CI swap).
- `scripts/apply-migrations.ts` — the `db:apply` helper described in §0.
