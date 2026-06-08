import { defineConfig } from "tsup";

// Builds the published runtime JS. Declarations come from `tsc` (the
// `build:types` script → `dist-types/`), matching the api-extractor packages —
// tsup's rollup-dts doesn't play well with the workspace's composite tsconfigs.
//
// The package keeps `exports` pointing at `src` for in-repo dev/test (live TS,
// no build step); `publishConfig.exports` swaps to this `dist` output + the
// `dist-types` declarations at publish time. Workspace deps, React peers, and
// the optional @testing-library/react import are externalised by default.
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: false,
  sourcemap: true,
  clean: true,
});
