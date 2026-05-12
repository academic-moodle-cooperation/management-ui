# @oc-mui/plugin-example

A **minimal, brand-neutral reference plugin**. Copy this folder as the
starting point for a new plugin and edit the fields that matter to you.

This plugin is intentionally tiny. It exists to:

- Demonstrate the mandatory plugin contract (`initialize`, `activate`,
  `deactivate`) as defined in `packages/plugin-system`.
- Show one full example of registering data on an extension point
  (`app:header-logo`).
- Show how a theme file (`example.css`) lives next to the plugin that
  ships it.

If you need a richer example (sidebar items, settings pages, data
integration, etc.), write it as a new, focused plugin rather than
inflating this one. The whole point of `plugins/example` is that it
stays under 100 lines of code.

## Structure

```text
plugins/example/
├── example.css                       # Example theme (CSS variable overrides)
├── index.ts                          # Public barrel
├── modules/
│   ├── header-logo-example.ts        # The reference plugin
│   └── index.ts
├── package.json
├── tsconfig.json
└── vite-env.d.ts
```

## Using it as a template

1. Copy the folder: `cp -r plugins/example .local-plugins/my-plugin`
2. Rename the package in `package.json`
   (`@oc-mui/plugin-example` → `@your-scope/my-plugin`).
3. Rewrite `modules/header-logo-example.ts` to register on the extension
   points you actually need. See `plugins/core/README.md` for the list of
   extension points core exposes.
4. If you ship a theme, rename `example.css` to `<your-plugin>.css` and
   update the `previewUrl` in `admin-marketplace/src/services/themes.ts`
   accordingly (or register it at runtime from your own marketplace
   plugin).

## Contract guarantees

This plugin targets the Plugin Runtime API **1.0**. See
`docs/architecture/CONTRACTS.md` for the stability rules and
`packages/plugin-system/src/apiVersion.ts` for the exact constant.
