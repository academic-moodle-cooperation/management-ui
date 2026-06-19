# @oc-mui/plugin-admin-marketplace

The marketplace UI. Lets administrators browse, try, and install remote plugins (and themes) at runtime through the same loader the shell uses for JAR plugins.

## What it provides

| Extension point | What this plugin registers |
|------|------|
| `apps:definitions` | The marketplace app at `/admin/marketplace`. |
| `sidebar:nav-items` | The "Marketplace" sidebar entry. |

## Features

- **Plugin registry** — browse the configured registry, view metadata, install.
- **Developer mode** — paste any HTTPS URL serving an ESM bundle, "Try" it temporarily, or "Install" it (persisted to `localStorage`).
- **Auto-load on boot** — installed plugins load at app startup.
- **Theme installer** — same flow, but for CSS theme files; uses `theme-loader.ts`.
- **Plugin explorer** — toggle bundled (in-tree) plugins on/off through the runtime `enabled` switch.
- **`.local-plugins/` discovery (dev only)** — the marketplace lists what the shell already loaded from `/local-plugins/manifest.json`. The marketplace doesn't *load* `.local-plugins/` itself; the shell does.

## Structure

```
admin-marketplace/
├── src/
│   ├── services/
│   │   ├── local-plugins-manifest.ts   Read /local-plugins/manifest.json (dev)
│   │   ├── plugin-explorer.ts          Discover bundled plugins, enable/disable
│   │   ├── plugin-metadata.ts          Extension-point hints per plugin (TODO: read from manifest)
│   │   ├── registry-fetcher.ts         Pull from a registry API
│   │   ├── remote-loader.ts            Validate URL/version, then delegate to @oc-mui/remote-plugin-loader
│   │   ├── security.ts                 URL allowlist + version compat checks
│   │   ├── theme-loader.ts             Theme CSS try/install
│   │   ├── themes.ts                   Built-in theme list
│   │   └── view-preferences.ts         Persisted dashboard view mode
│   ├── views/
│   │   └── MarketplaceDashboard.tsx    The UI
│   └── index.ts                        Plugin entry
├── plugin.json
└── package.json
```

## How loading works

The marketplace doesn't reimplement loading — it composes:

1. **Validate** — `security.ts` checks URL allowlist (HTTPS-only, optional org-pinned hosts) and version compatibility.
2. **Delegate** — call `loadAndRegister(url, manager, options)` from [`@oc-mui/remote-plugin-loader`](../../packages/remote-plugin-loader/). That package owns the fetch/transform/CSS-inject/register pipeline.
3. **Persist** — if "Install", write to `localStorage` so the shell's auto-loader picks it up next boot.

JAR plugins are loaded by the **shell** at boot, not by the marketplace. The marketplace is optional for JAR deployments.

## See also

- [`docs/plugins/distribution.md`](../../docs/plugins/distribution.md) — full picture of the four distribution paths.
- [`packages/remote-plugin-loader/README.md`](../../packages/remote-plugin-loader/README.md) — the loader the marketplace delegates to.
- [`docs/operations/open-followups.md`](../../docs/operations/open-followups.md) §6 — note about migrating `plugin-metadata.ts` to read from `extensionPoints` manifests.
