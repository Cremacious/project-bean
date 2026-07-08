import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

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
