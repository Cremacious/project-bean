// scripts/create-reader.ts
import "./_env"; // MUST be first: loads .env.local before lib/auth -> db/client reads env
import { auth } from "@/lib/auth";

// Usage: npx tsx scripts/create-reader.ts <email> <password> <username> <displayName>
async function main() {
  const [email, password, username, displayName] = process.argv.slice(2);
  if (!email || !password || !username || !displayName) {
    console.error("Usage: tsx scripts/create-reader.ts <email> <password> <username> <displayName>");
    process.exit(1);
  }

  const result = await auth.api.signUpEmail({
    body: { email, password, name: displayName, username, displayName },
  });

  console.log(`Created reader "${username}" (${email})`, result.user?.id ?? "");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
