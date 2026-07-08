import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

// Load .env.local so modules that read process.env at import time (e.g. db/client.ts)
// don't throw when pulled in transitively by unit tests.
config({ path: fileURLToPath(new URL("./.env.local", import.meta.url)) });

export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts", "scripts/**/*.test.ts"],
  },
  resolve: {
    // Resolve the "@/*" path alias (matches tsconfig) so tests can import app modules.
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
});
