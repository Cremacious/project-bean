// Playwright global setup (issue #41). Runs once before any test.
//
// Its only job is to make sure the database the app will use has the schema and
// the seeded stories. This is gated on DB_DRIVER=pg, i.e. the CI / throwaway
// Postgres path:
//   - CI: the database is a fresh, empty Postgres service container, so we apply
//     the Drizzle migrations and seed the story catalog here.
//   - Local: DB_DRIVER is unset, the app uses the dev Neon database from
//     `.env.local` (which already has schema + stories), so this is a no-op. Run
//     `npm run db:seed` once yourself if that dev database is empty.
//
// It never reads `.env.local` and never touches production data.
import { execFileSync } from "node:child_process";

async function migrateFreshPostgres(connectionString: string): Promise<void> {
  // Use the node-postgres migrator directly so schema creation does not depend on
  // drizzle-kit picking the right driver. Dynamic imports keep `pg` off the
  // production code path.
  const { drizzle } = await import("drizzle-orm/node-postgres");
  const { migrate } = await import("drizzle-orm/node-postgres/migrator");
  const { Pool } = await import("pg");

  const pool = new Pool({ connectionString });
  try {
    const db = drizzle(pool);
    await migrate(db, { migrationsFolder: "drizzle" });
  } finally {
    await pool.end();
  }
}

export default async function globalSetup(): Promise<void> {
  if (process.env.DB_DRIVER !== "pg") {
    // Local dev Neon path: assume schema + seed already exist.
    return;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set for the E2E Postgres database");
  }

  console.log("[e2e] Applying migrations to the test Postgres database...");
  await migrateFreshPostgres(connectionString);

  console.log("[e2e] Seeding stories...");
  // The seed script reads db/client (DB_DRIVER=pg is already in the environment),
  // so it writes to the same test database. Inherit the environment so it does.
  const npmCli = process.platform === "win32" ? "npm.cmd" : "npm";
  execFileSync(npmCli, ["run", "db:seed"], { stdio: "inherit", env: process.env });

  console.log("[e2e] Database ready.");
}
