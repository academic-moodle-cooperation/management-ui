# Upgrading

How to move between Management UI versions without breaking your org plugins.

## Versioning model

Every workspace package is versioned **independently** following Semver. The four contracts in [`architecture/CONTRACTS.md`](../architecture/CONTRACTS.md) layer additional rules:

| Contract | Frozen at | Owner |
|----------|-----------|-------|
| Manifest | 1.1 | `@oc-mui/plugin-system` |
| Runtime API | 1.0 | `@oc-mui/plugin-system` |
| Theme | 2.0 | `@oc-mui/ui` + plugin consumers |
| Config | 1.0 | `@oc-mui/query` (`definePluginConfig`) |

A change observable to a plugin author through any of these surfaces is **always a major bump** of the affected package — even if Semver alone would say otherwise.

## Patch and minor upgrades

```bash
pnpm install
pnpm verify
```

That's it. Patch and minor versions are backwards-compatible by definition. The CI gates (lint, types, contract tests, API check) verify nothing drifted.

If `pnpm verify` fails after a minor bump, that's a regression in the upstream package — file an issue with the failing log.

## Major upgrades

Read the changelog first. Every breaking change ships with:

1. A `@deprecated` warning on the old symbol in the previous major.
2. A runtime warning in dev (when the deprecated symbol is called).
3. A changelog entry in the affected package's `CHANGELOG.md`.
4. An ADR if the break is architectural.

Plugin authors get a **one-major-cycle grace window**: a symbol marked `@deprecated` in `1.x` can only be removed in `2.0.0`.

When the host bumps `PLUGIN_API_VERSION` major, plugins compiled against the previous major are **cleanly rejected** by the loader with `"Plugin requires API major X, host provides Y"`. There's no silent break — your plugin either loads or fails loudly.

### Steps

1. Update the workspace dependency.
2. Search the relevant package's `CHANGELOG.md` for the version you're moving to. Read every entry.
3. Apply each migration step.
4. Bump your plugin's `apiVersion` in `plugin.json` if the runtime API major changed.
5. Run `pnpm verify` (or for an external plugin, your equivalent gate).
6. Test against the shell with your plugin loaded.

### What to expect from a Manifest break

A Manifest major bump means a required field changed shape or was renamed. The shell's runtime validator (Zod-backed) rejects plugins that don't conform. Update your `plugin.json` to match the new schema in [`packages/plugin-system/src/schemas/plugin.schema.json`](../../packages/plugin-system/src/schemas/plugin.schema.json).

### What to expect from a Runtime API break

A Runtime API major bump changes what `createPlugin`'s `initialize` callback receives or what's accepted on extension points. Read the changelog, follow the migration steps. The loader rejects mismatched majors at boot.

### What to expect from a Theme break

A Theme major bump removes or renames a token. Update your plugin CSS to use the new tokens. The contract guarantees additions are minor — so most of the time, theme major bumps mean cleanup of long-deprecated names.

### What to expect from a Config break

A Config major bump changes what the reader API or the `AppConfig` shape exposes. The schema validation catches mismatches; update your plugin's Zod schema if you owned values that moved.

## Upgrading the host (a deployment)

For ops teams running Management UI against an Opencast backend:

1. Take the new shell build (`apps/shell/dist/`).
2. Drop in the new JARs in `$OPENCAST_HOME/deploy/`.
3. Confirm `app.enabledPlugins` in your `config.json` still names the right plugins.
4. Restart.

If the new shell bumped `PLUGIN_API_VERSION` major, deployed plugins compiled against the old version will refuse to load — rebuild them against the new host before deploying.

## Rolling back

We don't `npm unpublish`. If a release goes sideways, deprecate the bad version with `npm deprecate` and ship a patch. Consumers who pinned the bad version can downgrade in their lockfile.

## See also

- [`architecture/CONTRACTS.md`](../architecture/CONTRACTS.md) — what's frozen and what isn't.
- [`operations/release.md`](../operations/release.md) — how releases get cut.
- [`operations/open-followups.md`](../operations/open-followups.md) — known issues and waiting-on-upstream items.
