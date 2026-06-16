import { defineConfig } from "vitest/config";

// The `@opencast-mui/*` alias that lived here rewrote bare specifiers to a flat
// directory path, which silently broke subpath imports like `@opencast-mui/ui/lib`.
// Dropping it lets vitest follow pnpm's workspace symlinks and each package's
// `exports` field — the same resolution path used in production builds.
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["../../vitest.setup.ts"],
    include: ["**/*.test.ts", "**/*.test.tsx"],
  },
});
