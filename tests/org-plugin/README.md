# Org-plugin tier

Contract + visual coverage for a plugin under `.local-plugins/`.

## Why this exists

Org plugins have **no automated coverage anywhere else**:

- `.local-plugins/` is gitignored, so nothing in it can ship a tracked test.
- `pnpm verify` runs with `--filter='!./.local-plugins/*'` — the whole directory
  is filtered out of lint, types, unit and contract runs.
- The mocked E2E suite boots `defaultConfig` with `plugins: []`.
- The integration suite runs against a vanilla podman Opencast.

Yet the org plugin is exactly what a manual tester spends their session on: the
sidebar, the footer, the landing page, the branding. This tier gives that
surface the same guarantees an in-tree plugin gets from
`src/plugin.contract.test.ts` — asserted from the outside, through the dev
server that serves the plugin, so it works even for a prebuilt plugin with no
`package.json`.

## Run

```bash
pnpm test:e2e:install                          # one-time: Chromium
ORG_PLUGIN=acme pnpm test:org-plugin           # contract + visual compare
ORG_PLUGIN=acme pnpm test:org-plugin:update    # (re)record visual baselines
```

`ORG_PLUGIN` is the **folder name** under `.local-plugins/`. Unset, every spec
skips and no dev server starts.

Two things that will waste your time otherwise:

- **Run `pnpm build` first** in a fresh clone or worktree. The shell's
  `vite.config.ts` imports `@oc-mui/vite-config`, so the dev server can't even
  start until the workspace packages are built.
- **`.local-plugins/<name>` must be a real directory, not a symlink.** The dev
  server's discovery uses `dirent.isDirectory()`, which is false for a symlink,
  so a symlinked plugin is silently invisible — the manifest check fails and the
  plugin never renders. Copy it in.

## What it checks

[`contract.spec.ts`](contract.spec.ts):

| Protocol § | Check |
|---|---|
| §9 | Every `modules[].entry` in `plugin.json` has a matching `dist/*.mjs`. |
| §9.5 | The dev local-plugins manifest lists every bundle, and each URL serves with a JS/CSS content type. |
| §5 | Every namespace in `i18nNamespaces` is discoverable as `modules/<type>/locales/<namespace>/` — the shape the loader actually scans. |
| §5 | Key parity across the locales of each namespace. |
| §7.7 | Theme CSS loads no external resource (`url(https://…)`, `@import`) — the GDPR/offline rule. Component-level selectors are reported as an annotation. |
| §2 | The shell boots with the plugin in `enabledPlugins` and logs no console errors. |
| — | At least one of the plugin's own translated strings renders — i.e. it didn't just load, it registered something. |

[`visual.spec.ts`](visual.spec.ts) snapshots the landing page in light and dark,
with and without the plugin's theme.

## The i18n check is the sharp one

The dev server discovers a namespace only when it is a **directory** under
`modules/<type>/locales/`:

```
modules/footer/locales/acme-footer/de.json     ✅ namespace "acme-footer"
modules/empty-state/locales/de.json            ❌ no namespace dir — never loads
```

A namespace declared in `plugin.json` but laid out flat is silently invisible:
the plugin loads, no error appears, and the strings just fall back. That's
exactly the kind of defect a manual pass either misses or spends an afternoon
on.

## Baselines are not committed

`__screenshots__/` is gitignored for this tier. Org branding does not belong in
the OSS repo. Keep the baselines wherever that org keeps its test artifacts and
restore them before a release run — and record them in the same environment you
compare in (see [`tests/visual/README.md`](../visual/README.md) on why baselines
are environment-sensitive).

## Adding a check

Everything generic goes in [`_org-plugin.ts`](_org-plugin.ts) and reads from the
plugin's own manifest and locale files, so a second org plugin needs no new
code — only `ORG_PLUGIN=<name>`. Resist hard-coding an org's strings or routes
here; assert on structure the manifest already declares.
