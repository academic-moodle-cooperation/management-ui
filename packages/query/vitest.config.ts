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
    // No-regression coverage gate (testing.md Follow-up). Floors below current
    // coverage; raise toward the 80% lib target as tests are added.
    coverage: {
      thresholds: { lines: 64, functions: 57, branches: 46, statements: 63 },
    },
  },
  resolve: {
    alias: {
      "@workspace": path.resolve(__dirname, "../../packages"),
    },
  },
});
