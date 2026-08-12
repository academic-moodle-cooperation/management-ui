# @oc-mui/store

Thin facade over Zustand and Jotai for application state. Plugins and apps import from here; the underlying library is an implementation detail. The public API surface is mechanically tracked in [`etc/store.api.md`](./etc/store.api.md).

## The wrapper rule

This package is the **only place in the workspace allowed to import from `jotai`** — enforced by `no-restricted-imports` in `@oc-mui/eslint-config` with an explicit exception for this directory. If we ever need to swap the state stack, we change the internals here without touching plugins or apps.

## Usage

```ts
import { useStore } from "@oc-mui/store";

const upload = useStore((s) => s.zustandupload);
```

Jotai primitives come from the `useTableStore` module (re-exported from the package root):

```ts
import { atom, useAtomValue } from "@oc-mui/store";
```

## Surface

Sources live at the package root (`index.tsx`, `useStore.ts`, `useTableStore.ts`, `atoms.ts` — no `src/`).

| Subpath | What it exports |
|---------|-----------------|
| `@oc-mui/store` | Everything below, plus `create` from Zustand for advanced callers. |
| `@oc-mui/store/useStore` | `useStore` — the global upload store (Zustand + Immer, persisted to `sessionStorage` under the `zustandupload` slice key) and its types (`Store`, `UploadFileBlob`, `UploadListType`). |
| `@oc-mui/store/useTableStore` | Jotai re-exports: `atom`, `atomWithStorage`, `createStore`, `Provider`, `useAtom`, `useAtomValue`, `useSetAtom`, `PrimitiveAtom` (type). Despite the filename, it contains no table state — it is the Jotai facade module. |
| `@oc-mui/store/atoms` | Currently **empty** — reserved for future shared atom definitions; application-specific atoms live in their consuming packages. |

The global `useStore` persists to `sessionStorage`; updates flow through Immer for safe immutable writes.

## Layer

Foundation. Depends on nothing in the workspace. Higher-layer packages and plugins consume it.

## See also

- [`etc/store.api.md`](./etc/store.api.md) — exhaustive type-level surface.
- [`docs/architecture/overview.md`](../../docs/architecture/overview.md#package-layers) — where this fits in the dependency layers.
