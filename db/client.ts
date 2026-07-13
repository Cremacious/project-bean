import { createRequire } from "node:module";
import { drizzle as drizzleNeon, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const rawConnectionString = process.env.DATABASE_URL;
if (!rawConnectionString) {
  throw new Error("DATABASE_URL is not set");
}
// Narrowed to string so the value stays typed inside createDb's closure below.
const connectionString: string = rawConnectionString;

type Schema = typeof schema;

// Neon's HTTP driver only talks to a Neon SQL-over-HTTP endpoint, which is exactly
// what dev and production want. End-to-end tests and CI instead run against a
// throwaway, standard Postgres (no Neon endpoint, no secrets), so when DB_DRIVER=pg
// is set we swap in the node-postgres driver. Both drivers expose the same Drizzle
// query API, so nothing downstream changes. `pg` is a dev-only dependency loaded
// lazily here, so the neon path never requires (or bundles) it in production.
function createDb(): NeonHttpDatabase<Schema> {
  if (process.env.DB_DRIVER === "pg") {
    const require = createRequire(import.meta.url);
    const { drizzle } = require("drizzle-orm/node-postgres");
    const { Pool } = require("pg");
    const pool = new Pool({ connectionString });
    return drizzle(pool, { schema }) as unknown as NeonHttpDatabase<Schema>;
  }
  const sql = neon(connectionString);
  return drizzleNeon(sql, { schema });
}

export const db = createDb();
export type DB = typeof db;
