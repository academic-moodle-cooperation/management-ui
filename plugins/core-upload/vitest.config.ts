import { defineConfig } from "vitest/config";

// Match the resolution behaviour used in production builds: no `@workspace/*`
// alias rewriting, so vitest follows pnpm symlinks and each package's
// `exports` map (which is what `@workspace/plugin-testing` relies on).
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["../../vitest.setup.ts"],
    include: ["**/*.test.ts", "**/*.test.tsx"],
  },
});
