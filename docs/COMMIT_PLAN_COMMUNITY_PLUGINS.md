# Commit plan: Community plugin system

Use this to split the current changes into logical, reviewable commits. Run from repo root.

## Prerequisites

- All changes **unstaged**: `git reset HEAD` (or keep staged and use `git add -p` per commit).
- Branch: `feature/community-plugin-system` (or your branch).

---

## Suggested commit order

### 1. Remote plugin loader and shared modules

**Message:** `feat(plugins): add remote plugin loader and shared modules`

**Scope:** Load remote `.mjs` plugins; resolve `@workspace/*` via shared modules; transform for browser.

```
packages/remote-plugin-loader/
apps/management-ui-core/src/shared/sharedModules.ts
packages/vite-config/ (only if needed for loader; otherwise in step 2)
```

```bash
git add packages/remote-plugin-loader/
git add apps/management-ui-core/src/shared/sharedModules.ts
git commit -m "feat(plugins): add remote plugin loader and shared modules"
```

---

### 2. Vite: .local-plugins dev server and manifest

**Message:** `feat(vite): add .local-plugins dev server and manifest`

**Scope:** Dev-only middleware that scans `.local-plugins/`, builds manifest, serves `dist/*.mjs`; optional type from filename.

```
packages/vite-config/src/plugins/local-plugins-dev.ts
packages/vite-config/src/community-plugin.config.ts
packages/vite-config/src/plugins/fragment-extractor.ts
packages/vite-config/src/index.ts
packages/vite-config/package.json
packages/vite-config/src/plugin.config.ts
packages/vite-config/src/generate-config-plugin.ts
packages/vite-config/src/proxy.ts
```

```bash
git add packages/vite-config/
git commit -m "feat(vite): add .local-plugins dev server and manifest"
```

---

### 3. Core: load .local-plugins from manifest (single-phase)

**Message:** `feat(core): load .local-plugins from dev manifest`

**Scope:** Fetch `/local-plugins/manifest.json` in dev; load and register entries (no two-phase yet if you want to split; otherwise include two-phase here).

```
apps/management-ui-core/src/services/localPluginsManifest.ts
apps/management-ui-core/src/services/localPluginDiscovery.ts
apps/management-ui-core/src/components/PluginInitializer.tsx
apps/management-ui-core/src/loadPlugins.ts
apps/management-ui-core/src/main.tsx
apps/management-ui-core/vite.config.ts
apps/management-ui-core/package.json
```

```bash
git add apps/management-ui-core/
git commit -m "feat(core): load .local-plugins from dev manifest"
```

---

### 4. Two-phase config and selective plugin loading (optional separate commit)

**Message:** `feat(core): two-phase config and selective .local-plugins loading`

**Scope:** Load config plugin first; merge config; then load remaining .local-plugins by namespace/types; `getEnabledTypesForNamespace`; manifest `type` field.

- Same files as step 3, but with the two-phase and type-filtering logic, **or** commit step 3 first, then add the two-phase changes in this commit.

```bash
# If you did step 3 without two-phase, then:
git add apps/management-ui-core/src/components/PluginInitializer.tsx
git add apps/management-ui-core/src/loadPlugins.ts
git add packages/ui-config/src/index.ts
git add packages/vite-config/src/plugins/local-plugins-dev.ts
git commit -m "feat(core): two-phase config and selective .local-plugins loading"
```

---

### 5. Plugin system: registry, metadata, fragments

**Message:** `feat(plugin-system): fragment registry and plugin metadata validation`

**Scope:** FragmentRegistry, plugin-metadata schema, validator, export-registry script.

```
packages/plugin-system/package.json
packages/plugin-system/scripts/export-registry.ts
packages/plugin-system/src/IPlugin.ts
packages/plugin-system/src/index.ts
packages/plugin-system/src/pluginManager.ts
packages/plugin-system/src/schemas/plugin-metadata.schema.json
packages/plugin-system/src/services/FragmentRegistry.ts
packages/plugin-system/src/services/index.ts
packages/plugin-system/src/utils/pluginMetadataValidator.ts
```

```bash
git add packages/plugin-system/
git commit -m "feat(plugin-system): fragment registry and plugin metadata validation"
```

---

### 6. Remove built-in univie/tuwien from repo

**Message:** `chore(plugins): remove built-in univie/tuwien; use .local-plugins`

**Scope:** Delete `plugins/univie`, `plugins/tuwien`, and their theme CSS; document that sites use `.local-plugins/` (gitignored) for local copies.

```
plugins/themes/tuwien.css
plugins/themes/univie.css
plugins/tuwien/   (all deleted)
plugins/univie/   (all deleted)
plugins/index.ts
```

```bash
git add plugins/themes/
git add plugins/tuwien/
git add plugins/univie/
git add plugins/index.ts
git commit -m "chore(plugins): remove built-in univie/tuwien; use .local-plugins"
```

---

### 7. Admin marketplace: registry, security, themes, views

**Message:** `feat(admin-marketplace): registry, security, themes, view preferences`

**Scope:** Registry fetcher, local-plugins manifest, security, theme loader, view preferences, MarketplaceDashboard updates.

```
plugins/admin-marketplace/
```

```bash
git add plugins/admin-marketplace/
git commit -m "feat(admin-marketplace): registry, security, themes, view preferences"
```

---

### 8. Community plugin template

**Message:** `feat(plugins): add community plugin template`

**Scope:** New template plugin for scaffolding .local-plugins.

```
plugins/community-plugin-template/
```

```bash
git add plugins/community-plugin-template/
git commit -m "feat(plugins): add community plugin template"
```

---

### 9. Docs: community plugins and loading

**Message:** `docs: community plugin development and loading mechanisms`

**Scope:** All new/updated docs for community plugins, loading, migration, registry, examples.

```
docs/COMMUNITY_PLUGIN_AVAILABLE_PACKAGES.md
docs/COMMUNITY_PLUGIN_DEPENDENCY_MANAGEMENT.md
docs/COMMUNITY_PLUGIN_DEVELOPMENT.md
docs/COMMUNITY_PLUGINS_NEXT_STEPS.md
docs/PLUGIN_LOADING_MECHANISMS.md
docs/PLUGIN_STRUCTURE.md
docs/PLUGIN_DEVELOPMENT_INDEX.md
docs/PLUGIN_DEVELOPMENT_WORKFLOW.md
docs/PLUGIN_GRAPHQL_EXTENSIONS.md
docs/REGISTRY_REPOSITORY_README.md
docs/plugin-examples/
docs/registry-repo-contents/
docs/workflows/ADDING_PLUGINS.md
docs/AI_DEVELOPMENT_GUIDE.md
docs/GRAPHQL_MUTATIONS_EXTENDING.md
docs/GRAPHQL_MUTATION_EXAMPLE.md
docs/JAR_PLUGIN_DEPLOYMENT_SUMMARY.md
docs/PLAYER_IMPLEMENTATION_ESTIMATE.md
docs/local-plugins-backend-pom-fixes.md
docs/ideas/NOT_TOBIRA.md
```

```bash
git add docs/
git commit -m "docs: community plugin development and loading mechanisms"
```

---

### 10. Chore: workspace, turbo, clean, .gitignore

**Message:** `chore: workspace and clean scripts for plugins`

**Scope:** pnpm-workspace (`.local-plugins` if present), turbo.json, root package.json `clean:plugins`, .gitignore for `.local-plugins/`.

```
pnpm-workspace.yaml
turbo.json
package.json
.gitignore
plugins/README.md
plugins/core/README.md
plugins/example-university/README.md
apps/management-ui-upload/src/App.tsx
packages/query/src/fetcher.ts
packages/query/src/gql-generated.ts
packages/query/src/queries.graphql
packages/tailwind-config/src/shadcn-preset.ts
packages/ui/src/styles/globals.css
apps/management-ui-core/public/registry.json
```

```bash
git add pnpm-workspace.yaml turbo.json package.json .gitignore
git add plugins/README.md plugins/core/README.md plugins/example-university/README.md
git add apps/management-ui-upload/
git add packages/query/
git add packages/tailwind-config/
git add packages/ui/
git add apps/management-ui-core/public/registry.json
# add any remaining chore files
git commit -m "chore: workspace and clean scripts for plugins"
```

---

### 11. Lockfile

**Message:** `chore: pnpm-lock.yaml`

```bash
git add pnpm-lock.yaml
git commit -m "chore: pnpm-lock.yaml"
```

---

## Quick path (fewer commits)

If you prefer a smaller number of commits:

1. **feat(plugins): remote plugin loader and shared modules** — step 1  
2. **feat(plugins): .local-plugins dev support and core loading** — steps 2 + 3 + 4  
3. **feat(plugin-system): registry and metadata** — step 5  
4. **chore(plugins): remove univie/tuwien; add template** — steps 6 + 8  
5. **feat(admin-marketplace): registry, security, themes** — step 7  
6. **docs: community plugins and loading** — step 9  
7. **chore: workspace, turbo, clean, lockfile** — steps 10 + 11  

---

## After committing

- Run `pnpm install && pnpm run build` (and optionally `pnpm run test`).
- Open a PR and use the commit messages as PR description sections if helpful.
