# @workspace/store

**Version:** 0.0.0  
**Type:** Foundation / State Management  
**Last Updated:** 2025-01-15

## Purpose & Scope

The `@workspace/store` package provides a unified state management layer for the Management UI. It leverages two complementary libraries—**Zustand** and **Jotai**—to handle different types of state needs, ranging from complex persistent stores to lightweight atomic updates.

### Stability contract

This package is the **only place in the monorepo that is allowed to import from `jotai`** (and is also where `zustand` + `immer` are used). Apps, plugins and other packages must import store primitives from `@workspace/store`.

The rule for `jotai` is enforced by ESLint (`no-restricted-imports` in `packages/eslint-config/base.js`) with an explicit exception for this package. `zustand` and `immer` are used only internally today; they are not re-exported.

Why it matters: if we ever need to replace or upgrade the state management stack, we can do so by changing the internals of `@workspace/store` without breaking plugins or apps.

**In Scope:**

- Global, persistent application state (e.g., File Uploads).
- Atomic, localized state (e.g., Table UI state).
- State persistence using `sessionStorage`.
- Immutable state updates using **Immer**.

**Out of Scope:**

- Server-side state and caching (belongs in `@workspace/query`).
- Navigation state (belongs in `@workspace/router`).
- Local component-level state (should use standard `useState`).

## Architecture & Design Decisions

### Design Principles

- **Pragmatic Tooling:** We use **Zustand** for complex, structured state and **Jotai** for atomic, decoupled state.
- **Immutability:** All state updates in Zustand are performed using **Immer** to ensure safety and readability.
- **Persistence by Default:** Critical state like file uploads is automatically persisted to `sessionStorage` to survive page refreshes.

### Key Concepts

#### Zustand (Global Structured State)
Used for state that behaves like a traditional "Store" (actions, complex objects, persistence). The primary example is the `useStore` (Upload Store).

#### Jotai (Atomic State)
Used for lightweight, independent pieces of state. It is the preferred choice for UI-specific state like table filters or view options that might need to be shared across a few components.

### Architecture Diagram

```
┌─────────────────────────────────────────┐
│ @workspace/store Architecture           │
├─────────────────────────────────────────┤
│ [ Zustand Store ] <──> [ Persistence ]  │
│      (Uploads)            (Storage)     │
│                                         │
│ [ Jotai Atoms ]   <──> [ Table State ]  │
│      (UI Bits)            (Filters)     │
└─────────────────────────────────────────┘
```

## API Surface (Public Exports)

### Exports Structure

```typescript
export { useStore } from "./useStore";           // Zustand Upload Store
export { useAtom, atom, ... } from "./useTableStore"; // Jotai utilities
export { create } from "zustand";                // Re-export for custom stores
```

### Core API

#### `useStore` (Upload Store)
**Purpose:** Manages the entire lifecycle of file uploads.
**Key Actions:** `submitUpload`, `nextUpload`, `updateFile`, `resetUpload`.

#### Jotai Utilities
**Purpose:** Standard Jotai exports (`atom`, `useAtom`, `useAtomValue`) for creating and consuming atomic state.

## Dependencies & Coupling

### Dependency Graph

```
@workspace/store
├── External Dependencies
│   ├── zustand (^4.5.4)
│   ├── jotai (^2.6.4)
│   └── immer (^10.0.3)
└── Workspace Dependencies
    └── None (Core Foundation)
```

### Dependency Layer

**Layer:** Foundation

**Allowed to depend on:** Core Infrastructure (utils, configs).

**Rules:**
- Must not depend on UI, Query, or Router layers.
- Should remain a pure state layer.

## Usage Examples

### Using the Upload Store (Zustand)

```typescript
import { useStore } from "@workspace/store";

const UploadStatus = () => {
  const { zustandupload, submitUpload } = useStore();
  
  return (
    <div>
      <p>Files in queue: {zustandupload.files.length}</p>
      <button onClick={submitUpload}>Start Upload</button>
    </div>
  );
};
```

### Using Atomic State (Jotai)

```typescript
import { atom, useAtom } from "@workspace/store";

const filterAtom = atom("");

const FilterComponent = () => {
  const [filter, setFilter] = useAtom(filterAtom);
  return <input value={filter} onChange={(e) => setFilter(e.target.value)} />;
};
```

## File Structure

```
packages/store/
├── index.tsx                   # Main entry point
├── useStore.ts                 # Zustand Upload Store
├── useTableStore.ts            # Jotai utility exports
├── atoms.ts                    # Shared atom definitions
├── package.json
└── README.md                   # This file
```

## Related Packages

- [`@workspace/ui`](/packages/ui/README.md) - Consumes store state for displaying progress and table filters.

---

## Contributing

1. **New Store?** Use Zustand if you need persistence or have a complex set of related actions. Use Jotai if you just need to share a few primitive values.
2. **Persistence:** When using Zustand's `persist` middleware, always specify the storage (e.g., `sessionStorage`).
3. **Immutability:** Use the `immer` middleware for Zustand to keep update logic clean.
