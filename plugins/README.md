# Built-in plugins

Plugins that ship with the OSS repo and are enabled by default. Org and community plugins live elsewhere (`.local-plugins/<org>/` for dev, separate repos for distribution).

```
plugins/
├── core/                  Shared core utilities — extension points other plugins build on
├── core-episodes/         /episodes route + sidebar + config defaults
├── core-series/           /series route + sidebar + create action + config defaults
├── core-upload/           /upload route + sidebar + config defaults
├── admin-marketplace/     Marketplace UI for installing/trying remote plugins
├── example/               Minimal reference implementation — start here when learning
├── assets/                Default fallback assets (favicons, fonts)
└── index.ts               Exports the bundled plugins consumed by the shell
```

See [ADR-003](../docs/architecture/decisions/003-shell-plus-core-plugins.md) for why feature code lives here instead of under `apps/`.

## In-tree vs `.local-plugins/`

| Path | Use it for |
|------|------------|
| `plugins/<name>/` | Built-in plugins shipped with this repo. Bundled into `@oc-mui/plugins`, statically loaded at startup. |
| `.local-plugins/<name>/` | Org or community plugins. Gitignored. Loaded at dev time through `/local-plugins/manifest.json`. Each is its own git repo. |

Full path map: [`docs/plugins/distribution.md`](../docs/plugins/distribution.md).

## Scaffolding

```bash
# Org / community plugin (default)
pnpm create-plugin my-plugin             # → .local-plugins/my-plugin/

# Built-in plugin shipped with this repo
pnpm create-plugin my-plugin --in-tree   # → plugins/my-plugin/
```

After `--in-tree` scaffolding, add the export to [`./index.ts`](./index.ts).

## Assets

Default favicons and fonts live in [`./assets/`](./assets/). The `viteStaticCopy` plugin in `packages/vite-config/src/shell.config.ts` copies them into the build output at `/management-ui/assets/...`.

Org plugins override by shipping their own `assets/favicon/` and `assets/fonts/`. The resolution order is **plugin-specific assets first, fallback to defaults**, so any plugin can replace any asset without touching the core.

The shipped theme CSS files live in [`apps/shell/public/plugins/themes/`](../apps/shell/public/plugins/themes/) (aurora, example, forest-sage, heritage-burgundy, modern-slate, oxford-navy, press) — that is where the marketplace's theme service points. The default org theme (token overrides) is [`apps/shell/src/themes/default.css`](../apps/shell/src/themes/default.css). Org plugins distributing their own theme ship the CSS with the plugin.

## See also

- [`docs/plugins/creating-a-plugin.md`](../docs/plugins/creating-a-plugin.md) — full walkthrough.
- [`docs/plugins/distribution.md`](../docs/plugins/distribution.md) — in-tree / `.local-plugins/` / JAR / CDN.
- [`AGENTS.md`](../AGENTS.md) — operational pre-flight checklist.
