---
name: pre-flight-check
description: Run the AGENTS.md pre-flight checklist before declaring a plugin or package change complete in the Management UI repo. Use proactively whenever you have finished editing code under plugins/, .local-plugins/, or packages/ and are about to tell the user the change is done. Verifies the createPlugin entry, plugin.json manifest + extensionPoints sync, the required contract test, import boundaries, the config-slice rule, semantic-token theming, api-check + changeset for public-API changes, doc sync, and that pnpm verify passes.
---

# Pre-flight check

Before declaring a code change finished in this repo, walk the `AGENTS.md` pre-flight
checklist. Do not claim the change is done until every applicable item is satisfied.
Report each item as ✓ / ✗ / n/a with a one-line reason, then a PASS/FAIL verdict.

Skip items that don't apply (e.g. a docs-only or shell-only change has no plugin
contract test), and say why they're n/a.

## Checklist (mirrors AGENTS.md → "Pre-flight checklist")

1. **Plugin entry** — the plugin default/named-exports `createPlugin({...})` from
   `@opencast-mui/plugin-system`, and **every** `manager.registerObject(...)` call lives in
   `initialize()`, not `activate()`. (`activate`/`deactivate` are for side effects only;
   the test harness re-registers between tests.)
2. **Manifest** — `plugin.json` exists at the plugin root with the Manifest 1.1 fields
   (`id`, `name`, `version`, `description`, `author`, `namespace`) and an
   `extensionPoints` array.
3. **extensionPoints sync** — every extension point `initialize()` populates appears in
   `plugin.json`'s `extensionPoints`, and vice-versa. (The contract test enforces this;
   a key colliding with another plugin's fails lint.)
4. **Contract test** — `src/plugin.contract.test.ts` exists, copied from a sibling with
   only the import line + `describe` label changed, and
   `pnpm --filter @opencast-mui/plugin-<name> test:contract` is green.
5. **Boundaries** — the plugin imports nothing from `apps/*`, another
   `plugins/<other>/*` or `.local-plugins/<other>/*`, or a wrapped library directly
   (use `@opencast-mui/router`/`query`/`i18n`/`store`, never `@tanstack/*`, `i18next`,
   `jotai`). Allowed: `@opencast-mui/*`, `plugins/core`, self, already-wrapped third-party libs.
6. **Config slice** — the plugin declares its schema with `definePluginConfig` and reads
   only its own slice via `.use()`; it never reads another plugin's config slice.
7. **Theme** — no hex colors, hardcoded font names, or raw spacing values in plugin code;
   semantic tokens only (`docs/plugins/styling.md`).
8. **Public-API change → api-check + changeset** — if any `@opencast-mui/*` package's exported
   surface changed, you ran `pnpm api-check`, committed the regenerated
   `packages/*/etc/*.api.md`, **and** added a changeset (`pnpm changeset`) at the right
   bump level. (CI rejects a versioned-package change without a changeset, and a drifted
   `.api.md` snapshot.)
9. **Docs in sync** — any doc the change makes stale is updated in the same change. Use
   AGENTS.md's "Where to find things" table to locate docs that name what you touched.
10. **`pnpm verify` is green locally** — the canonical gate. Run it (or `/verify`).

If any applicable item is ✗, fix it before telling the user the change is complete.
