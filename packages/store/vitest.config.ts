import path from "path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["../../vitest.setup.ts"],
    include: ["**/*.test.ts", "**/*.test.tsx"],
    // No-regression coverage gate (testing.md Follow-up #3). store is fully
    // covered today; hold it high. Raise/relax with intent.
    coverage: {
      thresholds: { lines: 95, functions: 95, branches: 95, statements: 95 },
    },
  },
  resolve: {
    alias: {
      "@workspace": path.resolve(__dirname, "../../packages"),
    },
  },
});
