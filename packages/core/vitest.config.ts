import { defineConfig } from "vitest/config";

// The shared core's own test runner. Core tests are pure (no env, no DB, no
// framework), so unlike the web config this loads no .env and needs no path
// aliases: every import inside core is relative. `npm run test -w
// @bedtime-quests/core` runs these in isolation; the root `npm run test` also
// picks them up so CI keeps covering them without any workflow change.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
