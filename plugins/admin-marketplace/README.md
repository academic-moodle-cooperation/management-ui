# @oc-mui/plugin-admin-marketplace

The marketplace UI. Lets administrators browse, try, and install remote plugins (and themes) at runtime through the same loader the shell uses for JAR plugins.

## What it provides

| Extension point | What this plugin registers |
|------|------|
| `apps:definitions` | Two marketplace apps: `/admin/marketplace/plugins` and `/admin/marketplace/themes` (`src/index.ts`). |
| `sidebar:nav-items` | The "Marketplace" sidebar entry with Plugins/Themes sub-entries (`permissions: ["admin.view"]`). |
| `app:config:defaults` | The `config.plugins["admin-marketplace"]` slice defaults (`src/config.ts`) — including `remotePlugins.enabled` and `remotePlugins.allowedDomains`. |

## Access model

The marketplace loads and executes third-party code at runtime, so it is restricted to administrators: both routes and the sidebar entry carry `requiredRoles: ["ROLE_ADMIN"]`, enforced by the shell's route gate against the user's granted roles from `/info/me.json`. A deployment using a different admin role overrides it via `config.plugins["admin-marketplace"].protection.requiredRoles`.

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
│   ├── components/                     List items, detail view, theme modal
│   ├── hooks/
│   │   └── useMarketplace.ts           Dashboard state
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
│   ├── config.ts                       Config slice (remotePlugins.enabled/allowedDomains)
│   ├── plugin.contract.test.ts         Required contract test
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

- [`docs/extend/distribution.md`](../../docs/extend/distribution.md) — full picture of the four distribution paths.
- [`packages/remote-plugin-loader/README.md`](../../packages/remote-plugin-loader/README.md) — the loader the marketplace delegates to.
- [`docs/reference/open-followups.md`](../../docs/reference/open-followups.md) §6 — note about migrating `plugin-metadata.ts` to read from `extensionPoints` manifests.
