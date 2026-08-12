import path from "path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["../../vitest.setup.ts"],
    include: ["**/*.test.ts", "**/*.test.tsx"],
    // No-regression coverage gate (testing.md Follow-up). ui coverage is low
    // today (many shadcn primitives are untested); this floor stops it from
    // sliding further while tests are backfilled toward the 80% target.
    coverage: {
      thresholds: { lines: 26, functions: 12, branches: 13, statements: 26 },
    },
  },
  resolve: {
    alias: {
      "@workspace": path.resolve(__dirname, "../../packages"),
    },
  },
});
