# Using `.local-plugins/` with Management UI

The `.local-plugins/` directory at the **monorepo root** holds organization plugins (for example Univie, TU Wien, shared config). They are **not** committed in this repo (see root `.gitignore`); each developer or CI job brings their own copy.

**An empty directory** is also fine: the shell build only copies `.local-plugins` locale files when at least one `modules/*/locales/**/*.json` exists, so you will not get spurious copy warnings from an empty folder.

## Typical setup

1. Clone this monorepo.
2. Clone your plugins repo (or copy plugin trees) **into** `.local-plugins/`, e.g. `.local-plugins/univie/`, `.local-plugins/config/`.
3. From the **monorepo root**:

   ```bash
   pnpm install
   ```

   Workspace entries in `pnpm-workspace.yaml` include `.local-plugins/*`, so `@oc-mui/*` dependencies in those plugins resolve like any other package.

4. **Rebuild a plugin’s `dist/` when you change its source** (the dev shell loads the built `.mjs` files). The smallest step is to build only that plugin:

   ```bash
   cd .local-plugins/univie && pnpm build
   ```

   Alternatively, from the **monorepo root**, `pnpm build` runs Turbo across the workspace and will run each package’s `build` script, including plugins under `.local-plugins/*` — useful when you already want a full build; it is slower than building a single plugin.

5. Run the shell app as usual; in dev, plugins under `.local-plugins/` are served and listed in `/local-plugins/manifest.json` when present.

## JARs (backend)

Plugin JARs are built with Maven from paths such as `.local-plugins/<name>/backend/pom.xml`. They expect the monorepo layout (parent `backend/`, `node/`, `pnpm` at the repo root). See [COMMUNITY_PLUGINS_NEXT_STEPS.md](./COMMUNITY_PLUGINS_NEXT_STEPS.md) for details.

Optional: `.local-plugins/pom.xml` aggregates several `*/backend` modules so you can run `mvn -f .local-plugins/pom.xml clean install` to build all listed plugin JARs in one go. Add a `<module>` when you add a new plugin with a `backend/` folder.

## Public plugin mirror

The Univie plugin (and future org plugins) may also live in a separate public repo; development still uses a checkout **inside** this monorepo at `.local-plugins/<name>/` so `workspace:*` and Maven paths stay valid.
