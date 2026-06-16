import { defineConfig } from "vitest/config";

// The legacy `@opencast-mui/*` alias rewrote bare specifiers to a flat directory
// path, which silently broke subpath imports like `@opencast-mui/ui/lib` and
// stops `@opencast-mui/plugin-testing` from resolving via its `exports` map.
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
