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
  },
  resolve: {
    alias: {
      "@workspace/ui/lib/utils": path.resolve(__dirname, "./src/lib/utils.ts"),
      "@workspace/ui/lib": path.resolve(__dirname, "./src/lib"),
      "@workspace/ui": path.resolve(__dirname, "./src"),
      "@workspace": path.resolve(__dirname, "../../packages"),
    },
  },
});
