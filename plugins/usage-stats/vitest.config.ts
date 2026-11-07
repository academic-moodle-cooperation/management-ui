import { defineConfig } from "vitest/config";

// Mirrors the in-tree siblings (core-episodes et al.): no `@oc-mui/*` alias,
// so vitest follows pnpm's workspace symlinks and each package's `exports`
// field — the same resolution path the production build uses.
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["../../vitest.setup.ts"],
    include: ["**/*.test.ts", "**/*.test.tsx"],
  },
});
