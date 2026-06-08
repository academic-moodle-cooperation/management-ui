import { defineConfig } from "tsup";

// JS via tsup → dist/; declarations via tsc (`build:types` → dist-types/).
// `exports` stay on src for in-repo dev/test; `publishConfig.exports` swaps to
// dist at publish. React/react-dom (peers) and workspace deps are externalised.
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: false,
  sourcemap: true,
  clean: true,
});
