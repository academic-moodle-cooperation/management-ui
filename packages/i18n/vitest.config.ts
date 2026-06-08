import path from "path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node", // Use node for simple helper function tests
    setupFiles: ["../../vitest.setup.ts"],
    include: ["**/*.test.ts", "**/*.test.tsx"],
    // No-regression coverage gate (testing.md Follow-up). Floors below current
    // coverage; raise toward the 80% lib target as tests are added.
    coverage: {
      thresholds: { lines: 50, functions: 44, branches: 17, statements: 50 },
    },
  },
  resolve: {
    alias: {
      "@workspace": path.resolve(__dirname, "../../packages"),
    },
  },
});
