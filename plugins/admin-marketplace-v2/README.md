# admin-marketplace-v2

Ground-up marketplace rebuild, running **in parallel** to
[`admin-marketplace`](../admin-marketplace/) (the upload-v2 pattern) while
features migrate piece by piece. Each feature is discussed against
[INTENT.md](../../INTENT.md) — the marketplace's job there is *catalog &
discovery* and being the *ecosystem showcase* — before it lands. Functions
that don't serve that intent are dropped, not ported.

## Current scope

**Discover** (`/admin/marketplace-v2`, admin-only): read-only browsing of the
plugins and themes offered by configured registries — search, category
filters, and a detail dialog. Browsing never fetches or executes remote code.

**Try** — the one gesture, and deliberately the only one (no install;
permanence goes through the deployment path). "Try" shows a consent dialog,
records a marker in `sessionStorage`, and reloads: the plugin then loads
through the boot path, so routes/config/i18n actually work — and the trial
dies with the browser tab. The marker is re-validated against every security
gate on each boot. Load failures surface in the trial banner with the reason.

Security gates (all fail-closed, see [`src/services/security.ts`](src/services/security.ts)):
deployment opt-in → domain allowlist (suffix-matched, no bare `github.io`) →
HTTPS in production (`allowInsecureHttp` opt-out for TLS-less hosts) →
workspace/API compatibility → integrity. When a registry entry carries an
SRI `integrity` hash, the fetched bytes must match or the load aborts
(verified inside `@oc-mui/remote-plugin-loader`, no second fetch);
`requireIntegrity: true` refuses unpinned entries entirely.

**Library** (second tab, `#library`): the deployment's plugin inventory —
one row per namespace, grouped by status (*Active* · *Trials* · *Available
but disabled*), with origin (Built-in / Deployment JAR / Local dev / Trial /
Shell), module types, version, and a read-only "Registry: x.y.z" hint when the
catalog knows a newer version. Deliberately no toggles: enabling a plugin for
the whole organisation is a deployment step, so every row shows and copies the
exact `app.enabledPlugins` value (the namespace) and explains which of the
shell's two gates (`app.enabledPlugins`, `config.plugins.<ns>.enabled`) keeps a
present plugin off. Sources: `manager.plugins`, the shell-injected
`marketplace.getAllPlugins`, `/management-tool/ui/config/plugins.json`, the
dev `.local-plugins` manifest, and this tab's trials.

The Library has exactly one gesture, and it is the same word as in Explore:
**Try** on a present-but-disabled plugin previews it **in this tab only**. No
code is fetched — the plugin is already deployed; the marketplace records the
namespace through `@oc-mui/plugin-system`'s preview contract
(`addPluginPreview`, `sessionStorage`) and reloads, and the shell's
`PluginInitializer` treats previewed namespaces as enabled at every load gate
(bundled, JAR, `.local-plugins`). Typical use: look at a plugin on staging
before deciding to list it in `app.enabledPlugins` for everyone.

**Themes** (Explore → *Themes*, and the Themes section under *All*): every
theme this deployment could apply — shipped showcase themes (listed in
`apps/shell/public/plugins/themes/index.json`), org themes next to deployed
or local plugins (probed at the conventional CSS paths), and registry entries
of category `theme`. **Try** applies a theme *immediately in this tab* (CSS
needs no boot path), survives a refresh via a `sessionStorage` marker, and
ends with one click or with the tab. Same-origin themes are trusted; registry
CSS goes through the Try gates (it can pull remote fonts/images). A theme
becomes permanent only via `app.theme` — the row shows that value to copy;
the Library shows which theme is active for everyone.

**Catalog entries for deployed plugins.** When a registry entry's id (or
`namespace`) matches a plugin deployed here, Try it in Explore previews the
local copy through the preview contract instead of fetching the bundle again,
and a running copy shows "Active here". This is the multi-tenant shape: JARs
deployed centrally, listed in the catalog, switched on per tenant.

**Overlaps.** Some slots only one plugin can fill — footer, landing page,
sidebar, header. Before a trial, the dialog names the active plugins that
already fill the slots the candidate ships (from module types and extension
points) and offers to **pause** them in this tab: the preview contract's
mirror image (`mui.plugin-pauses`, honoured by the shell at every load gate).
End trial lifts the pause; nothing changes for anyone else. The Library lists
paused plugins in their own group.

Config slice (`config.plugins["admin-marketplace-v2"]`):

```json
{
  "registryUrls": ["https://example.org/mui-plugins/registry.json"],
  "featured": ["some-plugin-id", "another-plugin-id"],
  "try": {
    "enabled": false,
    "allowedDomains": ["cdn.jsdelivr.net", "raw.githubusercontent.com"],
    "allowInsecureHttp": false,
    "requireIntegrity": false
  }
}
```

In dev, the local `apps/shell/public/registry.json` is used as a fallback so
the catalog renders without any external registry. Entries there whose id
starts with `demo-` are catalog-only showcase data.

`featured` lists registry ids (in order) that get the Explore tab's big
cards; empty hides the section. Curation is a deployment decision for now — a
registry-side flag may follow once the central registry has a review process.

## Registry additions

The registry entry format ([`src/services/registry.ts`](src/services/registry.ts))
reads the presentational fields the plugin manifest (1.2) defines, so an
author declares them once: `namespace` (the `app.enabledPlugins` value the
detail view shows operators; defaults to the id), `tagline` (one-line pitch), `accentColor` (tile and
artwork color), `icon` (Lucide name; per-category default otherwise) and
`screenshots` (`[{ url, caption? }]`, loaded only from this origin or a
`try.allowedDomains` host — the generated artwork is the fallback),
`extensionPoints` and `pluginDependencies` (shown as "Extends" / "Requires",
the latter checked against the deployment's inventory). Plus `integrity` for
pinning. Everything falls back gracefully; v1 registries stay
fully compatible.

## Styling

Pure semantic tokens — no hardcoded colors. The intended look ships as the
**Ember** showcase theme (`apps/shell/public/plugins/themes/ember.css`, warm
anthracite dark / warm paper light, the host's bundled Geist); the view
degrades gracefully under every other theme. Artwork is generated from the
entry's accent (tile gradient, mock UI thumbnail, theme swatch parsed from the
theme's own CSS) — honest about being generated, and no image assets to host.

## Local demo setup

The route is admin-gated and the Try gesture is off by default, so a plain
`pnpm dev` without a backend shows neither. For a self-contained demo:

1. Start the stub backend — it answers `/info/me.json` and `/graphql` as a
   logged-in admin (see `docs/contribute/setup.md` → "No backend at all") and
   serves the test bundle `dev/trial-demo.mjs`:

   ```bash
   node plugins/admin-marketplace-v2/dev/stub-backend.mjs
   ```

2. Run the shell against it, keeping the local `config.json`:

   ```bash
   VITE_PROXY_TARGET=http://127.0.0.1:4600 VITE_LOCAL_CONFIG=true pnpm dev
   ```

3. In `apps/shell/public/ui/config/management-ui/config.json`, **locally and
   uncommitted**, set `"plugins": { "admin-marketplace-v2": { "try": { "enabled": true } } }`
   (the committed default stays fail-closed) and optionally `"app.theme": "ember"`
   to see the intended look.

The dev registry entry `trial-demo-local` points at the stub (`127.0.0.1:4600`)
and is integrity-pinned to the committed `dev/trial-demo.mjs`; if you edit that
file, recompute the hash (`openssl dgst -sha384 -binary <file> | base64`) and
update `apps/shell/public/registry.json`. Trying it loads a plugin that adds a
`/trial-demo` route — the proof that trials go through the boot path.
