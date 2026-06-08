import { defineConfig } from "tsup";

// JS via tsup → dist/; declarations via tsc (`build:types` → dist-types/),
// which also feeds api-extractor. The locale JSON files are runtime assets the
// host/consumer serves (not bundled), so they are copied into dist/locales on
// build. `exports` stay on src for in-repo dev/test; `publishConfig.exports`
// swaps to dist at publish time.
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: false,
  sourcemap: true,
  clean: true,
  onSuccess: "rm -rf dist/locales && cp -r src/locales dist/locales",
});
