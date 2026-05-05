import { defineConfig } from "vitest/config";

// The legacy `@workspace/*` alias rewrote bare specifiers to a flat directory
// path, which silently broke subpath imports like `@workspace/ui/lib` and
// stops `@workspace/plugin-testing` from resolving via its `exports` map.
// Drop it so vitest follows pnpm's workspace symlinks and each package's
// `exports` field — same resolution path used in production builds.
export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["../../vitest.setup.ts"],
    include: ["**/*.test.ts", "**/*.test.tsx"],
  },
});
