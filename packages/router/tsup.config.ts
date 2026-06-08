import { defineConfig } from "tsup";

// JS via tsup → dist/; declarations via tsc (`build:types` → dist-types/src/,
// preserving the src/ folder), which also feeds api-extractor. `exports` stay
// on src for in-repo dev/test; `publishConfig.exports` swaps to dist at publish.
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: false,
  sourcemap: true,
  clean: true,
});
