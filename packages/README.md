# Package Ecosystem

**Last Updated:** 2025-11-12

## Overview

This directory contains the **shared infrastructure packages** that power the Management UI system. These packages form the foundational layers that enable loosely-coupled, independently updatable applications and plugins.

## Design Philosophy

### Loose Coupling Principles

1. **Layer Separation** - Lower layers never depend on higher layers
2. **Explicit APIs** - Clear `exports` fields define public interfaces
3. **Minimal Dependencies** - Each package has only necessary dependencies
4. **Interface Stability** - Public APIs change infrequently, with migration guides
5. **Technology Agnostic** - Implementation details hidden behind abstractions

### Package Organization

Packages are organized into **dependency layers** to ensure proper coupling:

```
┌─────────────────────────────────────────────────────┐
│ Application Layer (Can depend on all below)         │
│ - app-runtime, providers, vite-config, ui-config    │
├─────────────────────────────────────────────────────┤
│ Integration Layer (Can depend on Foundation+Core)   │
│ - query, router, ui                                 │
├─────────────────────────────────────────────────────┤
│ Foundation Layer (Can depend on Core only)          │
│ - plugin-system, store, i18n                        │
├─────────────────────────────────────────────────────┤
│ Core Infrastructure (No workspace dependencies)     │
│ - utils, typescript-config, eslint-config,          │
│   tailwind-config                                   │
└─────────────────────────────────────────────────────┘
```

**Key Rule:** Packages can only depend on packages in lower layers.

## Package Catalog

### Core Infrastructure Layer

These packages have **zero workspace dependencies** and form the foundation.

| Package               | Purpose                           | Dependencies | Documentation                         |
| --------------------- | --------------------------------- | ------------ | ------------------------------------- |
| **utils**             | Common utility functions          | None         | [README](utils/README.md)             |
| **typescript-config** | Shared TypeScript configurations  | None         | [README](typescript-config/README.md) |
| **eslint-config**     | Shared ESLint rules               | None         | [README](eslint-config/README.md)     |
| **tailwind-config**   | Shared Tailwind CSS configuration | None         | [README](tailwind-config/README.md)   |

**Update Safety:** ⭐⭐⭐⭐⭐ Highest - Changes affect all packages

### Foundation Layer

These packages provide core functionality and can depend on Core Infrastructure.

| Package           | Purpose                         | Dependencies   | Documentation                          |
| ----------------- | ------------------------------- | -------------- | -------------------------------------- |
| **plugin-system** | Plugin architecture and runtime | React only     | [README](plugin-system/docs/README.md) |
| **store**         | Global state management         | React, Jotai   | [README](store/README.md)              |
| **i18n**          | Internationalization system     | React, i18next | [README](i18n/README.md)               |

**Update Safety:** ⭐⭐⭐⭐ High - Changes affect integration and app layers

### Integration Layer

These packages integrate external libraries and can depend on Foundation + Core.

| Package    | Purpose                           | Dependencies              | Documentation              |
| ---------- | --------------------------------- | ------------------------- | -------------------------- |
| **query**  | Data fetching & GraphQL client    | TanStack Query, GraphQL   | [README](query/README.md)  |
| **router** | Application routing               | TanStack Router           | [README](router/README.md) |
| **ui**     | Component library & design system | React, Radix UI, Tailwind | [README](ui/README.md)     |

**Update Safety:** ⭐⭐⭐ Medium - Changes affect applications

### Application Layer

These packages orchestrate the system and can depend on all lower layers.

| Package         | Purpose                          | Dependencies                     | Documentation                   |
| --------------- | -------------------------------- | -------------------------------- | ------------------------------- |
| **app-runtime** | Standalone app execution         | query, ui, plugin-system, router | [README](app-runtime/README.md) |
| **providers**   | React context providers          | Multiple workspace packages      | [README](providers/README.md)   |
| **ui-config**   | UI configuration management      | utils                            | [README](ui-config/README.md)   |
| **vite-config** | Shared Vite build configurations | Various                          | [README](vite-config/README.md) |

**Update Safety:** ⭐⭐ Low - Changes affect specific applications only

## Dependency Graph

### Visual Dependency Tree

```
app-runtime
├── query
│   └── (TanStack Query)
├── ui
│   ├── tailwind-config
│   └── (Radix UI, Tailwind CSS)
├── plugin-system
│   └── (React)
└── router
    └── (TanStack Router)

providers
├── query
├── router
├── plugin-system
└── i18n

ui-config
└── utils

vite-config
├── (Vite)
└── (Various build tools)

query
└── (TanStack Query, GraphQL)

router
└── (TanStack Router)

ui
├── tailwind-config
└── (Radix UI)

plugin-system
└── (React)

store
└── (Jotai)

i18n
└── (i18next)

utils
└── (No dependencies)

[config packages]
└── (No workspace dependencies)
```

## Package Update Guidelines

### Safe Update Order

When updating packages, follow this order to minimize issues:

1. **Core Infrastructure** (utils, config packages)
2. **Foundation Layer** (plugin-system, store, i18n)
3. **Integration Layer** (query, router, ui)
4. **Application Layer** (app-runtime, providers, ui-config, vite-config)

### Before Updating a Package

1. **Read the package README** - Understand current architecture
2. **Check dependency graph** - Know what depends on this package
3. **Review coupling analysis** - Understand coupling implications
4. **Check for circular dependencies** - Ensure you're not creating cycles
5. **Consider impact** - Higher layers = more impact

### After Updating a Package

1. **Update package README** - Document changes
2. **Update dependent packages** - If API changed
3. **Run validation** - `pnpm check-types && pnpm lint && pnpm build`
4. **Update migration guide** - If breaking changes
5. **Update this document** - If dependency structure changed

## Creating a New Package

See detailed guide: [/docs/workflows/ADDING_PACKAGES.md](/docs/workflows/ADDING_PACKAGES.md)

### Quick Start

1. **Determine layer** - Which layer should this package be in? See [architecture/overview.md](/docs/architecture/overview.md#package-layers).
2. **Create directory** - `packages/new-package/`
3. **Initialize** - Create `package.json`, `tsconfig.json`
4. **Match the style of a sibling README** - Look at the closest existing package and follow the same shape.
5. **Define exports** - Clear public API in `package.json`
6. **Add to workspace** - Update `pnpm-workspace.yaml` if needed
7. **Document** - Comprehensive README.md
8. **Update this file** - Add to catalog and dependency graph

### Package Naming Convention

- **Scope:** `@oc-mui/` for all workspace packages
- **Name:** Descriptive, kebab-case (e.g., `@oc-mui/plugin-system`)
- **Type:** Clearly indicates purpose (e.g., `-config`, `-runtime`)

## Technology Swapping

One of our goals is to make it **easy to swap technologies**. Here's how:

### Swapping Example: Query Library

**Current:** TanStack Query (React Query)

**To Swap:**

1. Create new implementation in `query` package
2. Keep same public API (hooks with same signatures)
3. Update internal implementation
4. Test all applications
5. Deploy

**Why this works:** The `query` package abstracts the query library. Apps depend on `@oc-mui/query`, not directly on TanStack Query.

### Swapping Example: UI Library

**Current:** Radix UI + Tailwind CSS

**To Swap:**

1. Update `ui` package components
2. Keep same component props and behavior
3. Update styling approach internally
4. Test visual consistency
5. Deploy

**Why this works:** Apps use `@oc-mui/ui` components, not Radix UI directly.

### Guidelines for Swappability

1. **Abstract external dependencies** - Don't expose third-party types in public APIs
2. **Define stable interfaces** - Public API should be technology-agnostic
3. **Hide implementation** - Use explicit `exports` to hide internals
4. **Document assumptions** - What behaviors must a replacement maintain?


## Common Patterns

### Pattern: Creating a Shared Hook

```typescript
// 1. Implement in appropriate package
// packages/query/src/hooks/useMyData.ts
export function useMyData() {
  // Implementation
}

// 2. Export from package index
// packages/query/src/index.ts
export { useMyData } from "./hooks/useMyData";

// 3. Use in applications
import { useMyData } from "@oc-mui/query";
```

### Pattern: Creating a Shared Component

```typescript
// 1. Implement in ui package
// packages/ui/src/components/MyComponent.tsx
export const MyComponent = () => {
  /* ... */
};

// 2. Export from package index
// packages/ui/src/index.ts
export { MyComponent } from "./components/MyComponent";

// 3. Use in applications
import { MyComponent } from "@oc-mui/ui";
```

### Pattern: Creating a Utility Function

```typescript
// 1. Implement in utils package
// packages/utils/src/myUtil.ts
export function myUtil() {
  /* ... */
}

// 2. Export from package index
// packages/utils/src/index.ts
export { myUtil } from "./myUtil";

// 3. Use anywhere
import { myUtil } from "@oc-mui/utils";
```

## Package Development

### Development Workflow

```bash
# From package directory
cd packages/[package-name]

# Install dependencies (if not done)
pnpm install

# Development
pnpm dev          # If package has dev mode

# Type checking
pnpm check-types

# Linting
pnpm lint

# Building
pnpm build        # If package needs building

# Cleaning
pnpm clean
```

### Testing Changes

```bash
# From monorepo root - test all packages
pnpm check-types  # Verify TypeScript
pnpm lint         # Verify linting
pnpm build        # Verify builds
pnpm test         # Run tests (if available)
```

## Package Standards

### Required Files

Every package must have:

- `package.json` - With proper `name`, `exports`, `scripts`
- `tsconfig.json` - Extending workspace config
- `README.md` - Following template
- `src/index.ts` - Main export file

### Recommended Files

- `src/types/` - TypeScript type definitions
- Tests - Unit tests for core functionality
- `eslint.config.js` - If custom linting needed

### Package.json Requirements

```json
{
  "name": "@oc-mui/package-name",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "clean": "...",
    "lint": "...",
    "check-types": "..."
  }
}
```

## Quality Checklist

Before considering a package production-ready:

- [ ] **Documentation** - Comprehensive README following template
- [ ] **Exports** - Clear public API via `exports` field
- [ ] **Dependencies** - Minimal, justified dependencies
- [ ] **Layer Compliance** - Only depends on lower layers
- [ ] **Type Safety** - Full TypeScript coverage
- [ ] **Tests** - Unit tests for core functionality
- [ ] **Examples** - Usage examples in README
- [ ] **No Circular Dependencies** - Verified with build
- [ ] **Performance** - Bundle size considered
- [ ] **Migration Guide** - If package has breaking changes

## Troubleshooting

### Issue: Circular Dependency

**Symptoms:** Build fails with circular dependency error

**Solution:**

1. Identify the cycle in the dependency graph
2. Extract shared code to a lower-layer package
3. Use dependency inversion (interfaces)
4. See [COUPLING_ANALYSIS.md](/docs/COUPLING_ANALYSIS.md)

### Issue: Package Not Found

**Symptoms:** Import from `@oc-mui/package` fails

**Solution:**

1. Verify package is in `pnpm-workspace.yaml`
2. Run `pnpm install` from root
3. Check `exports` field in `package.json`
4. Verify path in import statement

### Issue: Type Errors After Update

**Symptoms:** TypeScript errors after updating a package

**Solution:**

1. Check package's migration guide
2. Update usage to match new API
3. Run `pnpm check-types` to verify
4. Check if dependent packages need updates

## Related Documentation

- [Architecture overview](/docs/architecture/overview.md) — package layers and plugin boundaries
- [Documentation index](/docs/README.md) — audience-routed entry point
- [Application Documentation](/apps/README.md) — how apps use these packages
- [Plugin Documentation](/plugins/README.md) — how plugins use these packages
- [Adding Packages](/docs/workflows/ADDING_PACKAGES.md) — step-by-step guide for adding a new package

## Package Statistics

- **Total Packages:** 14
- **Core Infrastructure:** 4 packages
- **Foundation Layer:** 3 packages
- **Integration Layer:** 3 packages
- **Application Layer:** 4 packages

## Maintenance

### Package Ownership

[If applicable - document which teams own which packages]

### Review Process

Changes to packages should be reviewed for:

- Impact on dependent packages
- Adherence to layer principles
- API stability
- Documentation updates
- Test coverage

## Future Plans

[Document any planned package additions, removals, or major refactorings]

---

**Remember:** Good package design enables independent evolution. Each package should be understandable, updatable, and replaceable without breaking the system.
