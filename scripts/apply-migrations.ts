// scripts/apply-migrations.ts
//
// Applies pending Drizzle migrations over the neon-http driver.
//
// Why this exists: `drizzle-kit migrate` (npm run db:migrate) hangs forever
// against Neon (its connection path expects a websocket). The programmatic
// neon-http migrator below runs each statement as a plain HTTP request, so it
// completes, and it still writes the correct `drizzle.__drizzle_migrations`
// bookkeeping (hash + created_at) and is idempotent: it only applies journal
// entries newer than the last recorded one.
import "./_env"; // MUST be first: loads .env.local before db/client reads DATABASE_URL
import { migrate } from "drizzle-orm/neon-http/migrator";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";

type Row = Record<string, unknown>;
function rowsOf(result: unknown): Row[] {
  if (Array.isArray(result)) return result as Row[];
  const r = result as { rows?: Row[] };
  return r.rows ?? [];
}

async function ledger(): Promise<Row[]> {
  // The table may not exist yet on a brand-new database; treat that as empty.
  try {
    const res = await db.execute(
      sql`select id, hash, created_at from drizzle.__drizzle_migrations order by created_at`,
    );
    return rowsOf(res);
  } catch {
    return [];
  }
}

async function tableExists(name: string): Promise<boolean> {
  const res = await db.execute(sql`select to_regclass(${"public." + name}) as reg`);
  return rowsOf(res)[0]?.reg != null;
}

async function main() {
  const before = await ledger();
  console.log(`Ledger before: ${before.length} migration(s) recorded.`);
  for (const r of before) console.log(`  created_at=${r.created_at} hash=${String(r.hash).slice(0, 12)}...`);

  console.log("Applying pending migrations over neon-http...");
  await migrate(db, { migrationsFolder: "./drizzle" });

  const after = await ledger();
  const applied = after.length - before.length;
  console.log(`Ledger after: ${after.length} migration(s) recorded (${applied} newly applied).`);

  const ok = await tableExists("subscription");
  if (!ok) {
    console.error("WARNING: `subscription` table is still missing after migrate.");
    process.exit(2);
  }
  console.log("OK: `subscription` table is present.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
