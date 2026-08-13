# Upgrading against a new host

For plugin authors. Afterwards you'll know what a host upgrade can break in your plugin and what to do about each case.

Admins upgrading a deployment want [Operate → Upgrade](../operate/upgrade.md) instead.

Every workspace package is versioned **independently** following Semver, and the public contracts (plugin manifest, runtime API, theme, config, shared runtime dependencies, GraphQL operation naming) layer additional rules on top — the authoritative list, including each contract's current version, is [Contracts](../reference/contracts.md). A change observable to a plugin author through any of these surfaces is **always a major bump** of the affected package, even if Semver alone would say otherwise.

## Patch and minor upgrades

```bash
pnpm install
pnpm verify
```

That's it. Patch and minor versions are backwards-compatible by definition. If `pnpm verify` fails after a minor bump, that's a regression in the upstream package — file an issue with the failing log.

## Major upgrades

Read the changelog first. Every breaking change ships with a `@deprecated` warning on the old symbol in the previous major, a runtime warning in dev, a changelog entry in the affected package's `CHANGELOG.md`, and an ADR if the break is architectural. Plugin authors get a **one-major-cycle grace window**: a symbol marked `@deprecated` in `1.x` can only be removed in `2.0.0`.

Version mismatches fail loudly, never silently: when the host bumps `PLUGIN_API_VERSION` major, plugins compiled against the previous major are cleanly rejected by the loader (`"Plugin requires API major X, host provides Y"`), and a plugin whose declared `apiVersion` requires a newer **minor** than the host provides is rejected too. The exact compatibility rules and the `apiVersion` field semantics are in [Contracts → Runtime API](../reference/contracts.md#2-plugin-runtime-api-contract).

The steps:

1. Update the workspace dependency.
2. Search the relevant package's `CHANGELOG.md` for the version you're moving to and apply each migration step.
3. Bump your plugin's `apiVersion` in `plugin.json` if the runtime API major changed.
4. Run `pnpm verify` (or your external plugin's equivalent gate), then test against the shell with your plugin loaded.

What a break in each contract looks like:

| Contract | A major bump means | What you do |
| --- | --- | --- |
| **Manifest** | A required `plugin.json` field changed shape or was renamed; the shell's Zod-backed validator rejects non-conforming plugins | Update `plugin.json` to the new schema ([`plugin.schema.json`](../../packages/plugin-system/src/schemas/plugin.schema.json)) |
| **Runtime API** | What `createPlugin`'s `initialize` receives, or what extension points accept, changed | Follow the changelog's migration steps; the loader rejects mismatched majors at boot |
| **Theme** | A token was removed or renamed (additions are guaranteed minor) | Update your plugin CSS to the new tokens |
| **Config** | The reader API or the `AppConfig` shape changed | Update your plugin's Zod schema; validation catches mismatches |

## Rolling back a package release

We don't `npm unpublish`. If a release goes sideways, the bad version is deprecated with `npm deprecate` and a patch ships. Consumers who pinned the bad version can downgrade in their lockfile.

## See also

- [Contracts](../reference/contracts.md) — what's frozen and what isn't.
- [Releases](../contribute/release.md) — release lines, how releases get cut.
- [Open follow-ups](https://github.com/academic-moodle-cooperation/management-ui/blob/develop/docs/reference/open-followups.md) — known issues and waiting-on-upstream items. (GitHub link — the page is deliberately excluded from the published docs site.)
