# @oc-mui/plugin-example

## 1.0.4

### Patch Changes

- 25ad329: Dependency maintenance: TypeScript 5.5 → 6.0. The `tsconfig.json` files drop
  the now-deprecated `baseUrl` (every `paths` entry was already relative to the
  config file), `@oc-mui/vite-config` sets `rootDir` explicitly, and the
  packages that side-effect-import a stylesheet without resolving `vite/client`
  declare `*.css` themselves, since TypeScript 6 rejects unresolved side-effect
  imports by default.
- Updated dependencies
- Updated dependencies [25ad329]
- Updated dependencies [36c0360]
- Updated dependencies [55bd01a]
  - @oc-mui/plugin-system@1.3.1
  - @oc-mui/utils@1.3.1

## 1.0.3

### Patch Changes

- Updated dependencies [b1d5f78]
- Updated dependencies [312f77a]
  - @oc-mui/utils@1.3.0
  - @oc-mui/plugin-system@1.3.0

## 1.0.2

### Patch Changes

- 3b40cfc: Documentation-only: correct package READMEs against the code (docs overhaul Phase 1).
- Updated dependencies
- Updated dependencies [3b40cfc]
- Updated dependencies [31c19e7]
- Updated dependencies [9db8ada]
- Updated dependencies [3f6bf7d]
- Updated dependencies [2fbe7c9]
- Updated dependencies [a007934]
- Updated dependencies [a36e731]
- Updated dependencies [2044d7f]
  - @oc-mui/plugin-system@1.2.0
  - @oc-mui/utils@1.2.0

## 1.0.1

### Patch Changes

- Updated dependencies [4451b10]
- Updated dependencies [1234904]
- Updated dependencies [ca4f8f6]
- Updated dependencies [ed4a3d8]
  - @oc-mui/utils@1.1.0
  - @oc-mui/plugin-system@1.1.0
