# @oc-mui/plugin-example

A **minimal, brand-neutral reference plugin**. Copy this folder as the
starting point for a new plugin and edit the fields that matter to you.

This plugin is intentionally tiny. It exists to:

- Demonstrate the mandatory plugin contract (`initialize`, `activate`,
  `deactivate`) as defined in `packages/plugin-system`.
- Show one full example of registering data on an extension point
  (`app:header-logo`).

A matching example theme exists too, but it does **not** live in this
folder: the marketplace's theme service points at
[`apps/shell/public/plugins/themes/example.css`](../../apps/shell/public/plugins/themes/example.css),
where all shipped theme CSS files live.

If you need a richer example (sidebar items, settings pages, data
integration, etc.), write it as a new, focused plugin rather than
inflating this one. The whole point of `plugins/example` is that it
stays under 100 lines of code.

## Structure

```text
plugins/example/
├── index.ts                          # Public barrel
├── modules/
│   ├── header-logo-example.ts        # The reference plugin
│   └── index.ts
├── package.json
├── plugin.json                       # Manifest
├── plugin.contract.test.ts           # Required contract test
├── tsconfig.json
├── vite-env.d.ts
└── vitest.config.ts
```

## Using it as a template

Use `pnpm create-plugin <name>` instead of copying this folder by hand — the CLI scaffolds the full layout (package.json, plugin.json, tsconfig, vitest, contract test, README) with the right names and a working extension-point registration. See [`docs/plugins/creating-a-plugin.md`](../../docs/plugins/creating-a-plugin.md).

If you copy this folder manually, rename the package in [`package.json`](./package.json), rewrite [`modules/header-logo-example.ts`](./modules/header-logo-example.ts) to register on the extension points you need, and if you ship a theme update the `previewUrl` in [`plugins/admin-marketplace/src/services/themes.ts`](../admin-marketplace/src/services/themes.ts) (or register the theme at runtime from your own marketplace plugin).

## Contract

Targets the Plugin Runtime API — see [`docs/architecture/CONTRACTS.md`](../../docs/architecture/CONTRACTS.md). The exact host-API-version constant lives in [`packages/plugin-system/src/apiVersion.ts`](../../packages/plugin-system/src/apiVersion.ts).

## See also

- [`docs/plugins/creating-a-plugin.md`](../../docs/plugins/creating-a-plugin.md) — full walkthrough.
- [`docs/plugins/styling.md`](../../docs/plugins/styling.md) — the Theme Contract.
- [`plugins/core/README.md`](../core/README.md) — extension points you can register on.
