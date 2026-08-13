# Extending the workspace

For contributors to this repo. Afterwards you'll have added a top-level `packages/*` or `apps/*` member the workspace picks up.

Most ways to extend the Management UI are **plugins** — see [Building a plugin](../extend/plugin-guide.md). This page covers the two rarer, lower-level cases: adding a top-level **package** (a shared library) or a top-level **app** (a standalone-buildable surface).

Both are picked up automatically — `pnpm-workspace.yaml` globs `packages/*` and `apps/*`, so creating the directory is all the "registration" there is. There is no central manifest to edit.

> **Reach for a plugin first.** A new package is justified only by code that *multiple* packages/plugins share; a new app only by a surface that must build and run on its own (its own Vite entry + dev server). A new screen in the existing shell is a plugin (`apps:definitions`), not a new app.

## Add a package

1. `mkdir packages/<name>` and mirror the smallest existing package that fits (e.g. [`packages/utils`](../../packages/utils) for a leaf library, [`packages/query`](../../packages/query) for one with workspace deps).
2. `package.json` — name `@oc-mui/<name>`, `"type": "module"`, the standard scripts (`build` / `check-types` / `lint` / `test`), and workspace deps as `"@oc-mui/<dep>": "workspace:*"`.
3. `tsconfig.json` — `{ "extends": "@oc-mui/typescript-config/node-esm-library.json" }` (or `react-library.json` for a package that ships components).
4. Place it correctly in the dependency layering (core → foundation → integration → application) described in [Architecture](../reference/architecture.md). The ESLint `boundaries` rules enforce the app/plugin/package boundaries mechanically; the layer ordering *between* packages is convention today, not lint-enforced (tracked in [Open follow-ups §3.4](https://github.com/academic-moodle-cooperation/management-ui/blob/develop/docs/reference/open-followups.md)) — so review the layering yourself.
5. Add a short `README.md` (what it is, its layer, what may import it).
6. `pnpm install` (links it into the workspace), then `pnpm verify`.
7. If it's a versioned/published `@oc-mui/*` package, add a changeset — see [`release.md`](./release.md).

## Add an app

1. `mkdir apps/<name>` and mirror [`apps/playground`](../../apps/playground) (the minimal standalone app).
2. Pick a dev port. Taken today: **3000** shell, **3001** playground — port allocation lives in [`packages/vite-config/src/ports.ts`](../../packages/vite-config/src/ports.ts) (3001–3004 are reserved for dev-only apps, in-repo plugin dev servers start after them); add your app to `CORE_APP_NAMES` there rather than hard-coding a port.
3. Wire up the usual entry: `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`.
4. To surface the app *inside* the shell, register it on the `apps:definitions` extension point from a **plugin** (a route + component) — see [Building a plugin → Extension points](../extend/plugin-guide.md#extension-points). Don't hand-edit a shell route; the registry is the integration path.
5. `pnpm verify`.

## Checklist

- [ ] Directory under `packages/` or `apps/` (auto-discovered by the workspace globs).
- [ ] `package.json` name is `@oc-mui/<name>`; `tsconfig.json` extends the shared preset.
- [ ] Correct dependency layer — `pnpm lint` (boundaries) passes, and the package→package layering matches [Architecture](../reference/architecture.md) (checked by review, not lint).
- [ ] `README.md` present.
- [ ] Changeset added if the package is versioned.
- [ ] `pnpm verify` green.

## See also

- [Building a plugin](../extend/plugin-guide.md) — the common case (a plugin, not a package/app).
- [Architecture](../reference/architecture.md) — the package layers and dependency direction.
- [`release.md`](./release.md) — changesets, versioning, and the `pnpm verify` gate.
