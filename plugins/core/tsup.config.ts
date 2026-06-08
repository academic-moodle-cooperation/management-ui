import { defineConfig } from "tsup";

// The core infrastructure plugin's published entry. JS via tsup → dist/;
// declarations via tsc (`build:types` → dist-types/). Entry is the root
// `index.ts` (this package keeps its source at the package root, not in src/).
// `exports` stay on the root source for in-repo dev/test; `publishConfig.exports`
// swaps to dist at publish. React (peer) and workspace deps are externalised.
export default defineConfig({
  entry: ["index.ts"],
  format: ["esm"],
  dts: false,
  sourcemap: true,
  clean: true,
});
