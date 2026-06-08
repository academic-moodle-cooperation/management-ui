import { defineConfig } from "tsup";

// Multi-entry: this package exposes 4 subpath exports from flat root files.
// JS via tsup → dist/; declarations via tsc (`build:types` → dist-types/),
// which also feeds api-extractor. `exports` stay on the root source for in-repo
// dev/test; `publishConfig.exports` swaps to dist/dist-types at publish time.
export default defineConfig({
  entry: ["index.tsx", "atoms.ts", "useStore.ts", "useTableStore.ts"],
  format: ["esm"],
  dts: false,
  sourcemap: true,
  clean: true,
});
