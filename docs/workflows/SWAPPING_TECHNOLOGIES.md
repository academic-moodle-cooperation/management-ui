# Swapping Technologies in Management UI

**Last Updated:** 2025-11-12

## Overview

One of the core goals of Management UI's architecture is to enable **technology swapping** - the ability to replace underlying technologies (libraries, frameworks, tools) without breaking the system. This guide explains how to safely replace technologies.

## Swappability by Design

### Why Swappability Matters

- **Technology evolution** - Libraries become outdated
- **Performance optimization** - Newer alternatives may be faster
- **License changes** - Licensing may become incompatible
- **Vendor lock-in avoidance** - Maintain independence
- **Team preferences** - Different teams prefer different tools

### How We Enable Swappability

1. **Abstraction Layers** - Hide implementation details
2. **Explicit Exports** - Define clear public APIs
3. **Dependency Injection** - Pass dependencies, don't hardcode
4. **Interface Definitions** - Define contracts, not implementations
5. **Loose Coupling** - Minimize dependencies between layers

See [COUPLING_ANALYSIS.md](/docs/internal/COUPLING_ANALYSIS.md) for current coupling state.

## Swappability Assessment

Before attempting to swap a technology, assess difficulty:

### Easy to Swap ⭐⭐⭐⭐⭐

These are well-isolated with clear boundaries:

- `@oc-mui/utils` - Pure utility functions
- `@oc-mui/store` - State management (Jotai/Zustand)
- `@oc-mui/i18n` - Internationalization (i18next)
- Build tools - Vite, TypeScript, ESLint

**Why easy:** No workspace dependencies, clear interfaces

### Medium to Swap ⭐⭐⭐

These require more work but are feasible:

- `@oc-mui/query` - Data fetching (TanStack Query)
- `@oc-mui/router` - Routing (TanStack Router)
- UI library components - Radix UI

**Why medium:** Some coupling, but abstracted in packages

### Hard to Swap ⭐⭐

These are tightly integrated:

- `@oc-mui/ui` - Currently has high coupling
- `@oc-mui/plugin-system` - Core architecture
- React - Entire system built on it

**Why hard:** Extensive usage, tight coupling

## General Swapping Process

### Phase 1: Assessment

1. **Identify current technology** and its usage
2. **Evaluate alternatives** - research options
3. **Check coupling** - how tightly integrated?
4. **Estimate impact** - how many files affected?
5. **Plan migration** - gradual or all-at-once?

### Phase 2: Preparation

1. **Create abstraction layer** (if not exists)
2. **Define interface** - what must the replacement provide?
3. **Document requirements** - what behaviors must be maintained?
4. **Identify test coverage** - what needs testing?
5. **Create backup** - commit current working state

### Phase 3: Implementation

1. **Install new technology**
2. **Create adapter/wrapper**
3. **Update one package at a time**
4. **Test each step**
5. **Update documentation**

### Phase 4: Validation

1. **Run type checking**
2. **Run linting**
3. **Run tests**
4. **Manual testing**
5. **Performance testing**

### Phase 5: Cleanup

1. **Remove old technology**
2. **Update dependencies**
3. **Update documentation**
4. **Remove adapter (if temporary)**

## Technology-Specific Guides

### Swapping State Management

**Current:** Jotai + Zustand  
**Alternatives:** Redux, MobX, Recoil, Valtio

#### Step 1: Create Interface

```typescript
// packages/store/src/types.ts
export interface StateStore<T> {
  get: () => T;
  set: (value: T | ((prev: T) => T)) => void;
  subscribe: (callback: (value: T) => void) => () => void;
}
```

#### Step 2: Implement Adapter

```typescript
// packages/store/src/adapters/redux-adapter.ts
import { createStore } from "redux";

export function createReduxStore<T>(initialValue: T): StateStore<T> {
  const store = createStore((state = initialValue, action) => {
    if (action.type === "SET") {
      return typeof action.payload === "function" ? action.payload(state) : action.payload;
    }
    return state;
  });

  return {
    get: () => store.getState(),
    set: (value) =>
      store.dispatch({
        type: "SET",
        payload: value,
      }),
    subscribe: (callback) => store.subscribe(() => callback(store.getState())),
  };
}
```

#### Step 3: Update Package

```typescript
// packages/store/src/index.ts
// OLD
export { create } from "zustand";

// NEW
export { createReduxStore as createStore } from "./adapters/redux-adapter";
```

#### Step 4: Test

Verify all apps still work with new store.

---

### Swapping Data Fetching

**Current:** TanStack Query (React Query)  
**Alternatives:** SWR, Apollo Client, RTK Query

#### Step 1: Define Interface

```typescript
// packages/query/src/types.ts
export interface QueryResult<T> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export interface QueryClient {
  query<T>(key: string[], fetcher: () => Promise<T>): QueryResult<T>;
  mutate<T>(key: string[], mutator: () => Promise<T>): Promise<T>;
  invalidate(key: string[]): void;
}
```

#### Step 2: Implement Adapter

```typescript
// packages/query/src/adapters/swr-adapter.ts
import useSWR from "swr";

export function useQuery<T>(key: string[], fetcher: () => Promise<T>): QueryResult<T> {
  const { data, error, isLoading, mutate } = useSWR(key, fetcher);

  return {
    data,
    isLoading,
    isError: !!error,
    error: error || null,
    refetch: async () => {
      await mutate();
    },
  };
}
```

#### Step 3: Update Exports

```typescript
// packages/query/src/index.ts
// Keep same export name, different implementation
export { useQuery } from "./adapters/swr-adapter";
```

#### Step 4: Test Integration

All apps using `useQuery` should work without changes.

---

### Swapping Router

**Current:** TanStack Router  
**Alternatives:** React Router, Wouter, Next.js

#### Step 1: Define Interface

```typescript
// packages/router/src/types.ts
export interface Router {
  navigate: (to: string, options?: NavigateOptions) => void;
  useLocation: () => Location;
  useParams: () => Record<string, string>;
  Link: React.ComponentType<LinkProps>;
}
```

#### Step 2: Create Adapter

```typescript
// packages/router/src/adapters/react-router-adapter.ts
import { useNavigate, useLocation as useRRLocation, Link as RRLink } from "react-router-dom";

export function useNavigate() {
  const navigate = useRRNavigate();
  return (to: string) => navigate(to);
}

export { useRRLocation as useLocation, RRLink as Link };
```

#### Step 3: Gradual Migration

```typescript
// Update one app at a time
// packages/router/src/index.ts
export { useNavigate, useLocation, Link } from "./adapters/react-router-adapter";
```

---

### Swapping UI Library

**Current:** Radix UI + Tailwind  
**Alternatives:** Material UI, Chakra UI, Ant Design

This is more complex due to high coupling identified in [COUPLING_ANALYSIS.md](/docs/internal/COUPLING_ANALYSIS.md).

#### Step 1: Refactor Components (FIRST!)

Before swapping, reduce coupling:

```typescript
// BEFORE (in ui package - problematic)
import { useSeries } from '@oc-mui/query';

export function SeriesCard() {
  const { data } = useSeries();
  return <Card>{data.name}</Card>;
}

// AFTER (in ui package - better)
export interface SeriesCardProps {
  title: string;
  description: string;
}

export function SeriesCard({ title, description }: SeriesCardProps) {
  return (
    <Card>
      <h3>{title}</h3>
      <p>{description}</p>
    </Card>
  );
}

// Usage in app (not in ui)
import { SeriesCard } from '@oc-mui/ui';
import { useSeries } from '@oc-mui/query';

function Container() {
  const { data } = useSeries();
  return <SeriesCard title={data.name} description={data.description} />;
}
```

#### Step 2: Create Component Mapping

```typescript
// packages/ui/src/adapters/mui-adapter.tsx
import { Button as MuiButton } from '@mui/material';

// Map our API to MUI API
export const Button = ({ variant, ...props }: ButtonProps) => {
  const muiVariant = variant === 'outline' ? 'outlined' : 'contained';
  return <MuiButton variant={muiVariant} {...props} />;
};
```

#### Step 3: Swap Gradually

Replace components one at a time, keeping same props interface.

---

### Swapping Build Tool

**Current:** Vite  
**Alternatives:** Webpack, Turbopack, Parcel

#### Step 1: Isolate Build Config

Keep build config in `@oc-mui/vite-config`:

```typescript
// packages/vite-config/src/index.ts
export function createAppConfig(options) {
  // All Vite-specific logic here
}
```

#### Step 2: Create Webpack Config Package

```bash
# Create new package
mkdir packages/webpack-config

# Implement equivalent config
```

```typescript
// packages/webpack-config/src/index.ts
export function createAppConfig(options) {
  // Webpack equivalent
  return {
    entry: options.entry,
    output: {
      /* ... */
    },
    // ...
  };
}
```

#### Step 3: Update Apps

```typescript
// apps/management-ui-series/webpack.config.js
// Previously: vite.config.ts
import { createAppConfig } from "@oc-mui/webpack-config";

export default createAppConfig({
  appName: "management-ui-series",
  port: 3001,
});
```

---

## Best Practices for Swappability

### 1. Design for Swappability from Start

```typescript
// GOOD - Interface-based design
interface DataFetcher {
  fetch<T>(url: string): Promise<T>;
}

export function createFetcher(): DataFetcher {
  // Implementation can change
}

// BAD - Exposing third-party types
import { GraphQLClient } from "graphql-request";

export function createFetcher(): GraphQLClient {
  // Locked to graphql-request
}
```

### 2. Use Facade Pattern

```typescript
// packages/query/src/facade.ts
// Hide implementation details
export class QueryFacade {
  private client: any; // Internal implementation

  constructor() {
    this.client = createClient(); // Can be swapped
  }

  async query<T>(key: string): Promise<T> {
    // Consistent API regardless of implementation
  }
}
```

### 3. Document Abstraction Boundaries

In each package README:

```markdown
## Abstraction Layer

This package abstracts [technology]. To swap:

1. The public API that must remain stable: [list]
2. Internal implementation that can change: [list]
3. Required behaviors: [list]
4. Test suite to verify compatibility: [list]
```

### 4. Write Tests Against Interface

```typescript
// Test against interface, not implementation
describe("DataFetcher", () => {
  let fetcher: DataFetcher;

  beforeEach(() => {
    fetcher = createFetcher(); // Implementation doesn't matter
  });

  it("should fetch data", async () => {
    const data = await fetcher.fetch("/api/data");
    expect(data).toBeDefined();
  });
});
```

### 5. Use Dependency Injection

```typescript
// GOOD - Inject dependencies
export function createApp(config: { fetcher: DataFetcher }) {
  return new App(config.fetcher);
}

// BAD - Hardcoded dependencies
import { tanstackQuery } from "@tanstack/react-query";

export function createApp() {
  return new App(tanstackQuery); // Can't swap
}
```

## Swapping Checklist

Before attempting technology swap:

- [ ] Assess swappability (easy/medium/hard)
- [ ] Define interface/abstraction layer
- [ ] Document required behaviors
- [ ] Check current test coverage
- [ ] Evaluate alternatives thoroughly
- [ ] Plan gradual migration path
- [ ] Create backup (git commit)
- [ ] Implement adapter pattern
- [ ] Update one package at a time
- [ ] Test after each change
- [ ] Update documentation
- [ ] Remove old technology
- [ ] Performance test new technology
- [ ] Commit with migration notes

## Troubleshooting

### Issue: Too Many Usages

**Solution:** Create adapter that provides old API

```typescript
// Temporary adapter
export function oldAPI(...args) {
  return newAPI(transform(args));
}
```

### Issue: Breaking Changes

**Solution:** Version the migration

```typescript
// Support both versions temporarily
export function useData() {
  if (isNewVersion) {
    return newImplementation();
  }
  return oldImplementation();
}
```

### Issue: Performance Regression

**Solution:** Benchmark and optimize

```bash
# Before swap
pnpm benchmark

# After swap
pnpm benchmark

# Compare results
```

## Related Documentation

- [Coupling Analysis](/docs/internal/COUPLING_ANALYSIS.md) - Current coupling state
- [Package Ecosystem](/packages/README.md) - Package dependencies
- [Updating Dependencies](/docs/workflows/UPDATING_DEPENDENCIES.md) - Safe updates
- [Architecture Decisions](/docs/architecture/) - Design rationale

## Examples from Other Projects

### Case Study: React Query → SWR

**Challenge:** Swap data fetching library  
**Approach:** Created adapter layer  
**Result:** Swapped in 2 days with zero app changes

### Case Study: Radix UI → Material UI

**Challenge:** Swap UI library  
**Approach:** Component-by-component replacement  
**Result:** 2 weeks, required refactoring first

## Conclusion

Technology swapping is **possible** when architecture supports it:

✅ **Well-designed abstractions** make it easy  
⚠️ **Some coupling** makes it challenging  
❌ **Tight coupling** makes it very difficult

**Current state:** Most packages are swappable with medium effort. The `ui` package needs refactoring to reduce coupling before swapping would be practical.

**See:** [COUPLING_ANALYSIS.md](/docs/internal/COUPLING_ANALYSIS.md) for priorities.

---

**Remember:** Design for swappability from the start. It's much harder to add later.
