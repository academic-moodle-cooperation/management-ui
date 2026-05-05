import { defineConfig } from "vitest/config";

// jsdom is required because admin-marketplace's initialize() reads
// localStorage (RemoteLoader.getInstalledUrls). In a clean jsdom
// environment localStorage starts empty so no remote fetch is attempted.
export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["../../vitest.setup.ts"],
    include: ["**/*.test.ts", "**/*.test.tsx"],
  },
});
