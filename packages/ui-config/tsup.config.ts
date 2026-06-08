import { defineConfig } from "tsup";

// Builds the published runtime JS. Declarations come from `tsc`
// (`build:types` → `dist-types/`), which also feeds api-extractor — so this
// build does not touch the `.api.md` pipeline.
//
// The package keeps `exports` pointing at `src` for in-repo dev/test (live TS,
// no build step); `publishConfig.exports` swaps to `dist` + `dist-types` at
// publish time. Workspace deps and the React peer are externalised by default.
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: false,
  sourcemap: true,
  clean: true,
});
