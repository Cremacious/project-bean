import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

// Load .env.local so modules that read process.env at import time (e.g. db/client.ts)
// don't throw when pulled in transitively by unit tests.
config({ path: fileURLToPath(new URL("./.env.local", import.meta.url)) });

// Absolute path to the shared core's source, used to resolve the
// "@bedtime-quests/core" package (and its subpaths) to TypeScript source in this
// same repo, matching the tsconfig paths the web app uses.
const coreSrc = fileURLToPath(new URL("./packages/core/src/", import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    // Web (lib/**, scripts/**) tests plus the shared core's own tests, so the
    // single root `npm run test` keeps covering the logic that moved into core.
    include: ["lib/**/*.test.ts", "scripts/**/*.test.ts", "packages/core/**/*.test.ts"],
  },
  resolve: {
    // Order matters: match the exact package and its subpaths before the "@"
    // app alias. `$1` is substituted from the regex capture for subpath imports.
    alias: [
      { find: /^@bedtime-quests\/core$/, replacement: `${coreSrc}index.ts` },
      { find: /^@bedtime-quests\/core\/(.*)$/, replacement: `${coreSrc}$1.ts` },
      { find: "@", replacement: fileURLToPath(new URL(".", import.meta.url)) },
    ],
  },
});
