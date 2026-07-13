// scripts/apply-migrations.ts  (npm run db:apply)
//
// Applies pending Drizzle migrations to the target database over the neon-http
// driver. This is the reliable production migration path for this project.
//
// WHY THIS EXISTS
// ---------------
// `drizzle-kit migrate` (npm run db:migrate) HANGS FOREVER against Neon: the CLI
// migrator opens a websocket session transaction that the neon-http endpoint
// never completes, so it prints nothing and never exits. The *programmatic*
// migrator in `drizzle-orm/neon-http/migrator` (used below) instead sends each
// statement as a plain HTTP request, so it runs to completion. It also writes the
// correct `drizzle.__drizzle_migrations` bookkeeping (hash + created_at) and is
// idempotent: it only applies journal entries newer than the last recorded one.
//
// USAGE
//   npm run db:apply            # apply pending migrations to $DATABASE_URL
//   npm run db:apply -- --check # report ledger + pending state, apply nothing
//
// The target database is whatever DATABASE_URL points at (see scripts/_env.ts,
// which loads .env.local). To migrate production, run this with DATABASE_URL set
// to the production Neon connection string. See docs/DATABASE.md for the full,
// safe procedure (back up first, review the diff, verify after).
import "./_env"; // MUST be first: loads .env.local before db/client reads DATABASE_URL
import { readFileSync } from "node:fs";
import { migrate } from "drizzle-orm/neon-http/migrator";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";

const checkOnly = process.argv.includes("--check");

type Row = Record<string, unknown>;
function rowsOf(result: unknown): Row[] {
  if (Array.isArray(result)) return result as Row[];
  const r = result as { rows?: Row[] };
  return r.rows ?? [];
}

// Rows currently recorded in the Drizzle migration ledger. The table may not
// exist yet on a brand-new database, so treat a missing table as "empty".
async function ledger(): Promise<Row[]> {
  try {
    const res = await db.execute(
      sql`select id, hash, created_at from drizzle.__drizzle_migrations order by created_at`,
    );
    return rowsOf(res);
  } catch {
    return [];
  }
}

// The migrations the repo believes should be applied, from the generated journal.
function journalTags(): string[] {
  const journal = JSON.parse(
    readFileSync("./drizzle/meta/_journal.json", "utf8"),
  ) as { entries: { tag: string }[] };
  return journal.entries.map((e) => e.tag);
}

async function main() {
  const tags = journalTags();
  const before = await ledger();
  console.log(`Journal: ${tags.length} migration(s) generated locally.`);
  console.log(`Ledger:  ${before.length} migration(s) already recorded in the target DB.`);

  if (checkOnly) {
    const pending = tags.length - before.length;
    console.log(pending > 0
      ? `Pending: ${pending} migration(s) would be applied. (--check: applying nothing.)`
      : "Pending: none. Target DB is up to date with the journal.");
    return;
  }

  console.log("Applying pending migrations over neon-http...");
  await migrate(db, { migrationsFolder: "./drizzle" });

  const after = await ledger();
  const applied = after.length - before.length;
  console.log(`Ledger after: ${after.length} migration(s) recorded (${applied} newly applied).`);

  // Sanity check: the ledger should now match the journal exactly. A mismatch
  // means the ledger drifted (e.g. a migration was applied by hand without a
  // bookkeeping row) and needs manual reconciliation — see docs/DATABASE.md.
  if (after.length !== tags.length) {
    console.error(
      `WARNING: ledger has ${after.length} row(s) but the journal has ${tags.length}. ` +
        "Investigate before trusting migration state (docs/DATABASE.md).",
    );
    process.exit(2);
  }
  console.log(`OK: ledger matches journal (${after.length}/${tags.length}).`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
