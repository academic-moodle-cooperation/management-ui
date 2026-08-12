# What is Management UI?

Management UI is a modular admin interface for [Opencast](https://opencast.org), the open-source academic video platform. It is built around a plugin-first architecture: a thin shell hosts routing, auth, and layout, and every visible feature ships as a plugin — so orgs can customize the UI without forking core code.

## Who it's for

- **Universities and orgs running Opencast** who want a modern admin UI and the ability to customize it without forking core.
- **Plugin authors** who want to extend the admin UI without touching the host repo.
- **Contributors** working on the shell, the shared packages, or the built-in plugins.

## What's inside

```
This monorepo
├── apps/shell           The deployable Vite app. Routing, auth, layout, plugin loader.
├── apps/playground      Dev-only single-plugin sandbox.
├── packages/            Shared infrastructure (plugin-system, ui, query, router, i18n, …).
├── plugins/             Built-in plugins (episodes, series, upload, marketplace, …).
└── .local-plugins/      Org plugins (gitignored, each its own git repo).
```

The shell is unaware of any specific feature. It loads plugins, asks them what routes they own, what sidebar items to render, what theme to apply — and renders accordingly.

## How customization works

Plugins register **on extension points**. The shell exposes about two dozen extension points (`apps:definitions`, `sidebar:nav-items`, `app:header-logo`, `app:footer`, `app:config:defaults`, …). A plugin says "I provide a route at `/my-app`" or "I render this component in the header"; the shell wires it in at boot.

There's no hardcoded UI an org has to fork to change. Theme tokens are CSS variables overridden in a small CSS file. Routes come from plugins. Sidebar entries come from plugins. The host commits to **stability of the public contracts** — plugin manifest, runtime API, theme, config, and more, versioned in [`architecture/CONTRACTS.md`](../architecture/CONTRACTS.md); orgs commit to staying inside those contracts.

## How plugins are distributed

Four paths, depending on how the plugin is operated:

| Path | Used for |
|------|----------|
| **In-tree** (`plugins/<name>/`) | Plugins shipped with this OSS repo. Reviewed in PR. |
| **`.local-plugins/<org>/`** | Org-specific plugins, mounted at dev time. Each is its own git repo, gitignored from this one. |
| **JAR** | Production deploys with an Opencast backend. JARs ship a frontend + optional Java backend; Opencast serves them. |
| **CDN / community registry** | Plugins users install at runtime through the admin marketplace. |

Full details: [`plugins/distribution.md`](../plugins/distribution.md).

## Where to next

- **Use it** — [`installation.md`](./installation.md) walks through getting it running.
- **Configure it** — [`configuration.md`](./configuration.md) covers the config model.
- **Write a plugin** — [`docs/plugins/creating-a-plugin.md`](../plugins/creating-a-plugin.md).
- **Understand the architecture** — [`docs/architecture/overview.md`](../architecture/overview.md).
- **Contribute** — [`CONTRIBUTING.md`](../../CONTRIBUTING.md).
