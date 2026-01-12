# Adding New Packages to Management UI

**Last Updated:** 2025-11-12

## Overview

This guide walks through creating a new workspace package in the Management UI monorepo. Follow these steps to ensure your package is properly integrated, well-documented, and follows project standards.

## Prerequisites

- Node.js >= 20
- pnpm >= 10.4.1
- Understanding of [Package Ecosystem](/packages/README.md)
- Familiarity with [Coupling Analysis](/docs/COUPLING_ANALYSIS.md)

## Before You Start

### 1. Verify the Need

Ask yourself:

- **Does this belong in a package?** Or should it be in an app or plugin?
- **Can existing packages be extended?** Check if functionality fits elsewhere
- **Is it reusable?** Packages should be used by multiple apps/plugins

### 2. Determine the Layer

Based on [Coupling Analysis](/docs/COUPLING_ANALYSIS.md), determine which layer:

```
┌─────────────────────────────────────────────────────┐
│ Application Layer (Can depend on all below)         │
│ Examples: app-runtime, providers, vite-config       │
├─────────────────────────────────────────────────────┤
│ Integration Layer (Can depend on Foundation+Core)   │
│ Examples: query, router, ui                         │
├─────────────────────────────────────────────────────┤
│ Foundation Layer (Can depend on Core only)          │
│ Examples: plugin-system, store, i18n                │
├─────────────────────────────────────────────────────┤
│ Core Infrastructure (No workspace dependencies)     │
│ Examples: utils, *-config packages                  │
└─────────────────────────────────────────────────────┘
```

**Key Rule:** Lower layers NEVER depend on higher layers.

### 3. Plan Dependencies

- **List required dependencies** (external and workspace)
- **Justify each dependency** - Why is it necessary?
- **Check coupling** - Does this violate layer rules?
- **Consider alternatives** - Can dependencies be injected instead?

## Step-by-Step Guide

### Step 1: Create Package Directory

```bash
# From monorepo root
mkdir -p packages/[package-name]
cd packages/[package-name]
```

**Naming Convention:**

- Use kebab-case: `package-name`
- Descriptive names: `plugin-system`, `app-runtime`, `ui-config`
- Add suffix for type if helpful: `-config`, `-runtime`, `-system`

### Step 2: Initialize package.json

```bash
# Create package.json
pnpm init
```

Edit `package.json` with these essentials:

```json
{
  "name": "@workspace/[package-name]",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "clean": "rm -rf .turbo && rm -rf dist && rm -rf node_modules",
    "lint": "eslint . --ext .ts,.tsx --report-unused-disable-directives --max-warnings 0",
    "check-types": "tsc --noEmit -p tsconfig.json"
  },
  "dependencies": {},
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0"
  },
  "devDependencies": {
    "@workspace/eslint-config": "workspace:*",
    "@workspace/typescript-config": "workspace:*",
    "eslint": "^9.9.0",
    "typescript": "~5.5.4"
  }
}
```

**Important:**

- Use `@workspace/` scope
- Set `"private": true`
- Set `"type": "module"`
- Define explicit `exports`
- Include standard scripts
- Add dev dependencies for linting and types

### Step 3: Create TypeScript Configuration

Create `tsconfig.json`:

```json
{
  "extends": "@workspace/typescript-config/react-library.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Choose the right base config:**

- `react-library.json` - React components/hooks
- `node-esm-library.json` - Node.js utilities
- `base.json` - Generic TypeScript

### Step 4: Create Source Structure

```bash
mkdir -p src
```

Create `src/index.ts` as the main export file:

```typescript
// packages/[package-name]/src/index.ts

/**
 * @package @workspace/[package-name]
 * @description Brief description of what this package provides
 */

// Export main functionality
export { default as MainComponent } from "./MainComponent";
export { useMainHook } from "./hooks/useMainHook";

// Export types
export type { MainType, AnotherType } from "./types";
```

**Directory Structure:**

```
packages/[package-name]/
├── src/
│   ├── index.ts           # Main exports
│   ├── MainComponent.tsx  # Main functionality
│   ├── hooks/             # Custom hooks (if React)
│   │   └── useMain.ts
│   ├── types/             # TypeScript types
│   │   └── index.ts
│   └── utils/             # Internal utilities
│       └── helpers.ts
├── package.json
├── tsconfig.json
├── eslint.config.js       # Optional custom linting
└── README.md              # Documentation (Step 6)
```

### Step 5: Add Dependencies

#### External Dependencies

```bash
# Add external dependencies
pnpm add [package-name]

# Add dev dependencies
pnpm add -D [package-name]
```

#### Workspace Dependencies

```bash
# Add workspace dependencies
pnpm add @workspace/[other-package] --filter @workspace/[your-package]
```

**Before adding workspace dependencies:**

1. **Check layer rules** - Can you depend on this package?
2. **Justify the need** - Is this dependency necessary?
3. **Consider injection** - Can it be passed as a parameter instead?
4. **Update coupling analysis** - Document in [COUPLING_ANALYSIS.md](/docs/COUPLING_ANALYSIS.md)

### Step 6: Create Documentation

**CRITICAL:** Documentation is not optional.

Use the template:

```bash
# Copy template
cp docs/templates/PACKAGE_README_TEMPLATE.md packages/[package-name]/README.md
```

Edit the README.md following the template sections:

1. **Purpose & Scope** - What and why
2. **Architecture & Design Decisions** - How and why
3. **API Surface** - Public exports
4. **Dependencies & Coupling** - What it depends on
5. **Usage Examples** - How to use it
6. **Testing Strategy** - How to test
7. **Extension Points** - How to extend (if applicable)
8. **Migration Guide** - Breaking changes

**See examples:**

- [plugin-system README](/packages/plugin-system/docs/README.md) - Excellent example
- [ui README](/packages/ui/README.md) - Comprehensive example

### Step 7: Update Workspace Configuration

The package should automatically be picked up by `pnpm-workspace.yaml`:

```yaml
packages:
  - "packages/*"
```

If you're adding a special location, update `pnpm-workspace.yaml`.

### Step 8: Install Dependencies

```bash
# From monorepo root
pnpm install
```

This will:

- Install external dependencies
- Link workspace dependencies
- Set up symlinks

### Step 9: Implement Functionality

Now implement your package following these guidelines:

#### Code Quality

```typescript
// Use TypeScript with strict types
export interface MyInterface {
  property: string;
}

// Document public APIs with JSDoc
/**
 * Does something important
 * @param input - The input value
 * @returns The processed result
 */
export function myFunction(input: string): string {
  // Implementation
}

// Export only what's needed
export { publicFunction };
// Don't export: internalHelper (keep private)
```

#### Package Boundaries

```typescript
// GOOD: Clear interface, minimal dependencies
export interface DataFetcher {
  fetch<T>(query: string): Promise<T>;
}

export function createDataFetcher(config: Config): DataFetcher {
  // Implementation
}

// BAD: Exposing third-party types
import { QueryClient } from "@tanstack/react-query";
export function createFetcher(): QueryClient {
  // Tight coupling to implementation
}
```

#### Explicit Exports

Update `package.json` exports for granular access:

```json
{
  "exports": {
    ".": "./src/index.ts",
    "./hooks": "./src/hooks/index.ts",
    "./types": "./src/types/index.ts",
    "./utils": "./src/utils/index.ts"
  }
}
```

### Step 10: Add Tests

If the package has complex logic, add tests:

```bash
mkdir -p __tests__
```

Create test files:

```typescript
// __tests__/myFunction.test.ts
import { describe, it, expect } from "vitest";
import { myFunction } from "../src";

describe("myFunction", () => {
  it("should process input correctly", () => {
    expect(myFunction("test")).toBe("expected");
  });
});
```

Add test script to `package.json`:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "vitest": "^1.0.0"
  }
}
```

### Step 11: Update Package Ecosystem Documentation

Update [`/packages/README.md`](/packages/README.md):

1. **Add to package catalog**:

```markdown
| Package            | Purpose   | Dependencies   | Documentation                      |
| ------------------ | --------- | -------------- | ---------------------------------- |
| **[package-name]** | [Purpose] | [Dependencies] | [README]([package-name]/README.md) |
```

2. **Add to dependency graph**:

```
[your-package]
├── [dependency-1]
└── [dependency-2]
```

3. **Note any coupling issues** if they exist

### Step 12: Validate Package

Run validation checks:

```bash
# From package directory
cd packages/[package-name]

# Type checking
pnpm check-types

# Linting
pnpm lint

# Build (if applicable)
pnpm build

# From monorepo root - verify integration
cd ../..
pnpm check-types  # All packages
pnpm lint         # All packages
pnpm build        # All packages
```

### Step 13: Test Integration

Create a test usage in an app or plugin:

```typescript
// In apps/management-ui-core/src/test.tsx
import { myFunction } from "@workspace/[package-name]";

console.log(myFunction("test"));
```

Run the app:

```bash
cd apps/management-ui-core
pnpm dev
```

Verify:

- Package is correctly imported
- No type errors
- Functionality works as expected

### Step 14: Update Coupling Analysis

If you've added dependencies, update [`/docs/COUPLING_ANALYSIS.md`](/docs/COUPLING_ANALYSIS.md):

```markdown
### @workspace/[package-name]

**Coupling Score:** ⭐⭐⭐⭐ (4/5)

**Dependencies:**

- @workspace/[dependency] - [Why needed]

**Analysis:** [Coupling analysis]
```

### Step 15: Commit and Document

```bash
# Stage changes
git add packages/[package-name]
git add packages/README.md
git add docs/COUPLING_ANALYSIS.md

# Commit with descriptive message
git commit -m "feat(packages): add [package-name] package

- Implements [feature]
- Documented with comprehensive README
- Follows [layer] layer principles
- Dependencies: [list]
"
```

## Common Patterns

### Pattern: Utility Package

```typescript
// packages/my-utils/src/index.ts
export function formatDate(date: Date): string {
  return date.toISOString();
}

export function parseDate(str: string): Date {
  return new Date(str);
}
```

**Characteristics:**

- Layer: Core Infrastructure
- No workspace dependencies
- Pure functions
- Well-tested

### Pattern: React Hook Package

```typescript
// packages/my-hooks/src/useMyHook.ts
import { useState, useEffect } from "react";

export function useMyHook(initialValue: string) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    // Effect logic
  }, [value]);

  return [value, setValue] as const;
}
```

**Characteristics:**

- Layer: Foundation or Integration
- React as peer dependency
- Export hooks from index
- Document usage examples

### Pattern: Configuration Package

```typescript
// packages/my-config/src/index.ts
export interface MyConfig {
  apiUrl: string;
  timeout: number;
}

export const defaultConfig: MyConfig = {
  apiUrl: "https://api.example.com",
  timeout: 5000,
};
```

**Characteristics:**

- Layer: Core Infrastructure
- No dependencies
- Type definitions
- Default exports

## Troubleshooting

### Package Not Found

**Error:** `Cannot find package '@workspace/[package-name]'`

**Solutions:**

1. Run `pnpm install` from root
2. Check package name in `package.json`
3. Verify `pnpm-workspace.yaml` includes package directory
4. Check exports field in `package.json`

### Type Errors

**Error:** TypeScript can't find types

**Solutions:**

1. Verify `tsconfig.json` extends correct base
2. Check `types` field in `package.json`
3. Ensure `@types/` packages are installed
4. Run `pnpm check-types` to see specific errors

### Circular Dependency

**Error:** Build fails with circular dependency

**Solutions:**

1. Review dependency graph
2. Move shared code to lower layer
3. Use dependency inversion (interfaces)
4. See [Coupling Analysis](/docs/COUPLING_ANALYSIS.md)

### Build Failures

**Error:** Package fails to build

**Solutions:**

1. Check TypeScript configuration
2. Verify all imports are correct
3. Ensure dependencies are installed
4. Run `pnpm clean && pnpm install`

## Checklist

Before considering a package complete:

- [ ] Package directory created in `packages/`
- [ ] `package.json` with proper name, exports, scripts
- [ ] `tsconfig.json` extending workspace config
- [ ] `src/index.ts` with clear exports
- [ ] Comprehensive README.md following template
- [ ] Layer rules followed (no upward dependencies)
- [ ] Dependencies justified and documented
- [ ] Type definitions for all public APIs
- [ ] Usage examples in README
- [ ] Tests for complex logic
- [ ] `/packages/README.md` updated
- [ ] `/docs/COUPLING_ANALYSIS.md` updated if needed
- [ ] `pnpm check-types` passes
- [ ] `pnpm lint` passes
- [ ] Integration tested in an app
- [ ] Committed with descriptive message

## Related Documentation

- [Package Ecosystem](/packages/README.md) - Package overview and layers
- [Coupling Analysis](/docs/COUPLING_ANALYSIS.md) - Dependency rules
- [Package Template](/docs/templates/PACKAGE_README_TEMPLATE.md) - Documentation template
- [AI Development Guide](/AI_DEVELOPMENT_GUIDE.md) - AI navigation

## Examples

**Excellent Examples:**

- `@workspace/plugin-system` - Foundation layer, well-documented
- `@workspace/utils` - Core infrastructure, zero workspace deps
- `@workspace/i18n` - Foundation layer, single responsibility

**Complex Examples:**

- `@workspace/ui` - Integration layer, many components
- `@workspace/app-runtime` - Application layer, orchestration

## Best Practices

1. **Start Small** - Minimal implementation first, expand later
2. **Document Early** - Write README as you build
3. **Test Integration** - Verify usage in real app
4. **Follow Layers** - Respect dependency hierarchy
5. **Explicit APIs** - Clear exports, hidden internals
6. **Justify Dependencies** - Every dependency should have clear purpose
7. **Think Swappability** - Could this be replaced? Make it easier.
8. **Version Semantically** - Use semver for breaking changes

## Getting Help

- **Questions about layers?** Read [Coupling Analysis](/docs/COUPLING_ANALYSIS.md)
- **Not sure if it's a package?** Check [Package Ecosystem](/packages/README.md)
- **Need examples?** Look at existing packages
- **Documentation unclear?** Update this guide!

---

**Remember:** Good packages are small, focused, well-documented, and loosely coupled. When in doubt, favor simplicity and clear boundaries.
