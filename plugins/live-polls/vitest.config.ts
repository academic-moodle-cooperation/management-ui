import { defineConfig } from "vitest/config";

// Mirrors the other in-tree plugins: no `@oc-mui/*` alias, so vitest follows
// pnpm's workspace symlinks and each package's `exports` field — the same
// resolution path used in production builds.
export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["../../vitest.setup.ts"],
    include: ["**/*.test.ts", "**/*.test.tsx"],
  },
});
