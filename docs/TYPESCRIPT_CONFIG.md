# TypeScript Configuration Guide

## Overview

This document explains our TypeScript configuration strategy, specifically regarding `skipLibCheck` and `.d.ts` generation.

## skipLibCheck: true

### What it does

`skipLibCheck: true` tells TypeScript to skip type checking of declaration files (`.d.ts`) from dependencies in `node_modules`. This significantly speeds up type checking.

### Type Safety Impact

**Minimal impact on your code:**
- TypeScript still type-checks **your code** normally
- TypeScript still validates **what you actually use** from dependencies
- Only the **full declaration trees** of all dependencies are skipped

**Potential issues:**
- Inconsistencies or errors in library type definitions may go undetected
- Conflicting types from multiple libraries might not be caught

### Our Decision

We use `skipLibCheck: true` in `packages/typescript-config/base.json` because:

1. **Performance**: In a large monorepo, this saves significant time during development and CI
2. **Pragmatic**: The type safety loss is minimal and targeted
3. **Industry Standard**: Most large projects use this setting

### Optional Strict Checking

If you need maximum type safety (e.g., before releases), you can temporarily disable `skipLibCheck`:

```bash
# In a specific package
tsc --noEmit --skipLibCheck false
```

## .d.ts Generation

### Current Strategy: No Generation for Internal Packages

We **do not generate** `.d.ts` files for internal packages because:

1. **All consumers are TypeScript**: Internal packages can consume TypeScript source directly
2. **Modern bundler support**: Vite and other bundlers handle TypeScript source files natively
3. **Cleaner exports**: We use `package.json` exports with TypeScript source paths
4. **Faster builds**: No need to generate and maintain declaration files

### Configuration

- **Base config** (`packages/typescript-config/base.json`): `declaration: false`
- **Type checking**: Uses `tsc --noEmit` (no file generation)
- **Build**: Vite handles TypeScript compilation directly

### When to Generate .d.ts Files

Generate `.d.ts` files only if:

1. **Publishing packages externally**: External consumers need type definitions
2. **Project References**: Using TypeScript's project references for faster incremental builds
3. **Explicit API boundaries**: Want to enforce API boundaries by only exposing declarations

### Optional build:types Script

For packages that might be published in the future, we provide an optional `build:types` script.

**Example Implementation** (`packages/utils`):

1. **tsconfig.build.json**:
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "emitDeclarationOnly": true,
    "incremental": true,
    "outDir": "dist-types",
    "rootDir": "./src",
    "noEmit": false
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "dist-types", ".turbo", "**/*.test.ts"]
}
```

2. **package.json** script:
```json
{
  "scripts": {
    "build:types": "tsc -p tsconfig.build.json"
  }
}
```

3. **Usage**:
```bash
cd packages/utils
pnpm build:types
# Generates .d.ts files in dist-types/
```

**What it does**:
- Generates `.d.ts` declaration files only (no JavaScript)
- Outputs to `dist-types/` (separate from regular build output)
- Excludes test files
- Uses `composite: true` for potential project references

### Library Config Template

For packages that should generate declarations, use:

```json
{
  "extends": "../typescript-config/react-library.json"
}
```

This config includes:
- `composite: true`
- `declaration: true`
- `declarationMap: true`
- `incremental: true`

## Best Practices

1. **Default**: Use base config with `declaration: false` and `skipLibCheck: true`
2. **Type checking**: Always use `tsc --noEmit` for type checking (no file generation)
3. **Optional declarations**: Use `build:types` script only when needed
4. **CI/CD**: Run `check-types` in CI, optionally run `build:types` before releases

## References

- [TypeScript: skipLibCheck](https://www.typescriptlang.org/tsconfig#skipLibCheck)
- [TypeScript: emitDeclarationOnly](https://www.typescriptlang.org/tsconfig#emitDeclarationOnly)
- [TypeScript: Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
