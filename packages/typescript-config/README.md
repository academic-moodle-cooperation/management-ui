# @oc-mui/typescript-config

Shared TypeScript configurations. Every workspace package extends one of these so the compiler flags stay consistent.

## Configurations

| File | Extends | Use it for |
|------|---------|------------|
| `base.json` | — | ES2022 target, DOM libs, strict mode, `module: preserve`, bundler resolution. The foundation everything else builds on. |
| `node-esm-library.json` | `base.json` | Node ESM packages (build tooling, scripts). `module: node16`, emits `.d.ts` to `./dist`. |
| `react-library.json` | `base.json` | React libraries (`packages/ui`, plugins under `plugins/`). `react-jsx` transform, `module: ESNext`, composite project, incremental compile, `.d.ts` + sourcemaps to `./dist`. |
| `react-application.json` | `base.json` | The shell and the playground. `react-jsx`, `module: ESNext`, `noEmit`, composite off — bundler emits, tsc only type-checks. |

## Usage

```jsonc
// tsconfig.json
{
  "extends": "@oc-mui/typescript-config/react-library.json",
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

Pick the variant that matches what you're building. Project-specific overrides go in the local `compilerOptions`.

## Layer

Core infrastructure. Zero runtime dependencies — only ships JSON files.

## See also

- [`base.json`](./base.json) — the strict flags every package inherits.
- [`docs/architecture/overview.md`](../../docs/architecture/overview.md) — where this fits in the package layers.
