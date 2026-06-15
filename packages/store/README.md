# @opencast-mui/store

Thin facade over Zustand and Jotai for application state. Plugins and apps import from here; the underlying library is an implementation detail.

**Contract**: 1.x. The public API surface is mechanically tracked in [`etc/store.api.md`](./etc/store.api.md).

## The wrapper rule

This package is the **only place in the workspace allowed to import from `jotai`** — enforced by `no-restricted-imports` in `@opencast-mui/eslint-config` with an explicit exception for this directory. `zustand` and `immer` are internal-only; they are re-exported only as needed by callers.

If we ever need to swap the state stack, we change the internals here without touching plugins or apps.

## Usage

```ts
import { useStore } from "@opencast-mui/store";

const uploads = useStore((s) => s.uploads);
```

Atomic state from `@opencast-mui/store/atoms`:

```ts
import { useAtomValue } from "@opencast-mui/store/atoms";
```

## Surface

| Subpath | What it exports |
|---------|-----------------|
| `@opencast-mui/store` | `useStore` (global Zustand store with persistence), `useTableStore`, types (`Store`, `UploadFileBlob`, `UploadListType`), and `create` from Zustand for advanced callers. |
| `@opencast-mui/store/atoms` | Jotai primitives (`atom`, `useAtom`, …) used for lightweight decoupled state. |
| `@opencast-mui/store/useStore` | The Zustand hook on its own. |
| `@opencast-mui/store/useTableStore` | Table-UI state (sorting, pagination) for shared table components. |

The global `useStore` persists to `sessionStorage`; updates flow through Immer for safe immutable writes.

## Layer

Foundation. Depends on nothing in the workspace. Higher-layer packages and plugins consume it.

## See also

- [`etc/store.api.md`](./etc/store.api.md) — exhaustive type-level surface.
- [`docs/architecture/overview.md`](../../docs/architecture/overview.md#package-layers) — where this fits in the dependency layers.
