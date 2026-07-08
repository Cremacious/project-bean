// scripts/add-reader.ts
import "./_env"; // MUST be first: loads .env.local before db/client reads DATABASE_URL
import crypto from "node:crypto";
import { db } from "@/db/client";
import { user } from "@/db/schema";

// Usage: npx tsx scripts/add-reader.ts <username> <displayName>
// Creates a plain reader row (no auth account). Stories reference readers by
// <username> in their `readers: [...]` list; the login credential (AUTH_USERNAME
// in .env.local) should match the username of the reader whose stories you want
// to see after signing in.
async function main() {
  const [username, displayName] = process.argv.slice(2);
  if (!username || !displayName) {
    console.error("Usage: tsx scripts/add-reader.ts <username> <displayName>");
    process.exit(1);
  }

  await db
    .insert(user)
    .values({
      id: crypto.randomUUID(),
      name: displayName,
      email: `${username}@local`,
      emailVerified: false,
      username,
      displayName,
      theme: "cozy",
    })
    .onConflictDoNothing();

  console.log(`Ensured reader "${username}" (${displayName}).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
