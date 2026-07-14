import { defineConfig } from "tsup";

// The component library. Multi-entry: every exported source file (incl. the
// `./components/*` and `./hooks/*` wildcard targets) becomes its own dist entry
// so the subpath exports resolve. Structure under src/ is mirrored into dist/.
// JS via tsup; declarations via tsc (`build:types` → dist-types/src/). All deps
// (radix, react-aria, @oc-mui/*, …) and the React peer are externalised.
//
// CSS is not built: `globals.css` is a Tailwind-v4 entry the consumer/host
// processes, so it (and the bundled fonts) are copied verbatim into dist/styles.
export default defineConfig({
  // shadcn components import shared helpers via this package's own subpaths
  // (e.g. `@oc-mui/ui/lib/utils`). Externalise the self-name so the build leaves
  // those imports in place — they resolve through this package's own dist subpath
  // exports at consumer runtime — instead of trying to bundle `@oc-mui/ui` into
  // itself (which fails now that the top-level exports point at dist).
  external: [/^@oc-mui\/ui(\/|$)/],
  entry: [
    "src/index.ts",
    "src/components/**/*.{ts,tsx}",
    "src/hooks/**/*.ts",
    "src/lib/**/*.ts",
    "src/config-primitives.ts",
    "src/styles/index.ts",
    "!src/**/*.test.*",
    "!src/**/*.stories.*",
  ],
  format: ["esm"],
  dts: false,
  sourcemap: true,
  clean: true,
  onSuccess:
    "mkdir -p dist/styles && cp src/styles/globals.css dist/styles/globals.css && cp -r src/styles/fonts dist/styles/fonts",
});
