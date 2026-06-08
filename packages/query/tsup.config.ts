import { defineConfig } from "tsup";

// JS via tsup → dist/; declarations via tsc (`build:types` → dist-types/),
// which also feeds api-extractor. Codegen scripts (*.mjs) and *.graphql are dev
// inputs that the runtime doesn't import, so they aren't bundled. `exports` stay
// on src for in-repo dev/test; `publishConfig.exports` swaps to dist at publish.
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: false,
  sourcemap: true,
  clean: true,
});
