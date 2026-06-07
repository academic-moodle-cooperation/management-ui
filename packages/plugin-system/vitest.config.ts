import path from "path";

import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["../../vitest.setup.ts"],
    include: ["**/*.test.ts", "**/*.test.tsx"],
    // No-regression coverage gate (testing.md Follow-up #3). Floors sit a few
    // points below current coverage: headroom for refactors, but a real drop
    // fails `pnpm test:coverage`. Raise as coverage climbs.
    coverage: {
      thresholds: { lines: 90, functions: 84, branches: 82, statements: 90 },
    },
  },
  resolve: {
    alias: {
      "@workspace": path.resolve(__dirname, "../../packages"),
    },
  },
});
