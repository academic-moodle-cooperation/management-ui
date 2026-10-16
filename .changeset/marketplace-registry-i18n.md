---
"@oc-mui/plugin-admin-marketplace": minor
---

Make the marketplace's registry deployment-configurable and give remote plugins translations.

`remotePlugins.registryUrls` in the config slice names the registries (static `registry.json` files) whose entries the marketplace lists — until now only a dev-mode local registry was ever consulted, so no production deployment could actually browse anything. Listing and loading stay gated separately: entries become visible via `registryUrls`, executing them still requires `enabled` plus an allowlisted host.

Registry entries (and the localStorage install records) can now carry `localesUrl` + `i18nNamespaces`; the loader registers them the same way the JAR path does, so a remote-loaded plugin keeps its translations instead of falling back to raw keys — including across reloads, which replay installed plugins.
