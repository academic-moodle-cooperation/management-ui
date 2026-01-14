# TypeScript `any` Types Documentation

This document tracks the usage of `any` types in the codebase and provides guidance on when they are acceptable vs. when they should be replaced with proper types.

## Overview

TypeScript strict mode is **enabled** (`strict: true` in `packages/typescript-config/base.json`), but some `any` types remain for legitimate reasons (plugin system flexibility, dynamic function execution, etc.).

## Categorized `any` Usage

### ✅ Acceptable `any` Usage (Documented with ESLint Disable)

#### 1. Plugin System Types (`packages/plugin-system/src/types.ts`)

**Location:** `packages/plugin-system/src/types.ts`

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PluginComponent = React.ComponentType<any>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PluginFunction = (...args: any[]) => any;
```

**Reason:** The plugin system needs maximum flexibility to support various plugin implementations without breaking existing plugins. These types are intentionally flexible to allow plugins to register components and functions with different signatures.

**Status:** ✅ Documented and acceptable

---

### ⚠️ Should Be Improved (Priority: Medium)

#### 2. Plugin Manager Function Execution (`packages/plugin-system/src/pluginManager.ts`)

**Location:** `packages/plugin-system/src/pluginManager.ts:57, 138`

```typescript
executeFunction<T>(key: string, ...args: any[]): T | undefined;
```

**Current Usage:**

- Used for dynamic plugin function execution
- Generic return type `T` provides type safety for return values
- Arguments are `any[]` for flexibility

**Improvement Suggestion:**

- Consider using a union type or generic constraint for common argument patterns
- Document expected function signatures per plugin type

**Status:** ⚠️ Acceptable but could be improved

---

#### 3. Router Auth Routes (`packages/router/src/auth/createAuthRoutes.tsx`)

**Location:** `packages/router/src/auth/createAuthRoutes.tsx:25, 58`

```typescript
export const createLoginRoute = (parentRoute: any, options: AuthRouteOptions = {}) => {
export const createLogoutRoute = (parentRoute: any, options: AuthRouteOptions = {}) => {
```

**Reason:** TanStack Router's route types are complex and dynamic. Using `any` here avoids complex type gymnastics.

**Improvement Suggestion:**

- Investigate TanStack Router's type system for proper route typing
- Consider using `Route` type from `@tanstack/react-router`

**Status:** ⚠️ Should be improved with proper TanStack Router types

---

#### 4. App Config Sync (`packages/query/src/hooks/useAppConfig.ts`)

**Location:** `packages/query/src/hooks/useAppConfig.ts:27`

```typescript
export function getAppConfigSync(pluginManager?: any): AppConfig {
```

**Reason:** PluginManager type might not be imported or circular dependency issue.

**Improvement Suggestion:**

- Import `PluginManager` type from `@workspace/plugin-system`
- Or create a minimal interface for the required methods

**Status:** ⚠️ Should be improved

---

#### 5. Table Sidebar (`packages/ui/src/components/mui-table/TableSidebar.tsx`)

**Location:** `packages/ui/src/components/mui-table/TableSidebar.tsx:24`

```typescript
selectedItem?: any;
```

**Reason:** Generic table component that needs to work with various item types.

**Improvement Suggestion:**

- Make component generic: `TableSidebar<T>`
- Use `selectedItem?: T`

**Status:** ⚠️ Should be improved with generics

---

#### 6. Standalone App Wrapper (`packages/app-runtime/src/StandaloneAppWrapper.tsx`)

**Location:** `packages/app-runtime/src/StandaloneAppWrapper.tsx:43`

```typescript
const appRoutes: any[] = [];
```

**Reason:** Dynamic route collection from plugins.

**Improvement Suggestion:**

- Use proper route type from TanStack Router
- Type as `Route[]` or similar

**Status:** ⚠️ Should be improved

---

### ✅ Test Files (Acceptable)

#### 7. Test Files (`packages/plugin-system/src/plugins/objectRegistry/index.test.ts`)

**Location:** `packages/plugin-system/src/plugins/objectRegistry/index.test.ts:81`

```typescript
expect(result.map((r: any) => r.data.value)).toEqual([1, 2]);
```

**Reason:** Test file - `any` is acceptable for test assertions.

**Status:** ✅ Acceptable in tests

---

## `@ts-expect-error` / `@ts-ignore` Usage

### 1. Infinite Scroll Ref Type (`packages/ui/src/components/infinite-scroll.tsx`)

**Location:** `packages/ui/src/components/infinite-scroll.tsx:76`

```typescript
// @ts-expect-error ignore ref type
```

**Reason:** Ref type mismatch with third-party library (likely React ref forwarding issue).

**Status:** ✅ Documented and acceptable

---

## Summary

| Category                | Count  | Status |
| ----------------------- | ------ | ------ |
| Documented & Acceptable | 3      | ✅     |
| Should Be Improved      | 6      | ⚠️     |
| Test Files              | 1      | ✅     |
| **Total**               | **10** |        |

## Action Items

### High Priority

- [ ] Improve `getAppConfigSync` to use proper `PluginManager` type
- [ ] Make `TableSidebar` generic for type safety

### Medium Priority

- [ ] Improve router auth route types with TanStack Router types
- [ ] Improve `appRoutes` typing in StandaloneAppWrapper
- [ ] Consider improving `executeFunction` argument types

### Low Priority

- [ ] Document plugin function signatures for better type inference

## Guidelines

1. **Always document `any` usage** with ESLint disable comments and explanation
2. **Prefer generics** over `any` when possible
3. **Use union types** for known value sets
4. **Accept `any` in tests** - test files are less critical for type safety
5. **Plugin system flexibility** - Some `any` usage is intentional for plugin compatibility

## Related Files

- `packages/typescript-config/base.json` - TypeScript configuration
- `packages/plugin-system/src/types.ts` - Plugin type definitions
- `QUALITY_IMPROVEMENT_TRACKING.md` - Overall quality tracking
