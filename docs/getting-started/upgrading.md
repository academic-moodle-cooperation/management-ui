# Upgrading

For Opencast admins moving a deployment to a new Management UI version — and, in the [second half](#plugin-compatibility-for-plugin-authors), for plugin authors keeping org plugins compatible. Afterwards you'll know which version you're running, which release line to follow, and the exact steps for the upgrade.

## Which version am I running?

Look at the JAR filenames:

```bash
ls "$OPENCAST_HOME"/deploy/management-ui-*.jar
```

Released artifacts carry the **product version** in the filename (e.g. `management-ui-core-19.0.0.jar`); a build from an unreleased checkout carries Maven's snapshot version (`1.0-SNAPSHOT`) instead — then "your version" is whichever commit you built.

The product version's **major is pinned to the Opencast major it targets**: `19.x.y` runs on Opencast 19 and is maintained on the release-line branch `r/19.x`. To upgrade a deployment you follow your line's newest tag; moving to a new Opencast major means switching to that major's line. The full model — release lines, the `VERSION` file, tags, forward merges — is [Releases & versioning → Release lines and the product version](../operations/release.md#release-lines-and-the-product-version).

## Upgrading a deployment

1. **Build the new version.** Check out the tag (or release-line branch `r/NN.x`) you're upgrading to and build as in [Deployment](./deployment.md) — there are no prebuilt JAR downloads yet. Keep the old JARs around for rollback.
2. **Back up your config**: `$OPENCAST_HOME/etc/ui-config/mh_default_org/management-ui/config.json` (see [Configuration → The file](./configuration.md#the-file)). If you deploy with `-DdeployTo`, remember it can overwrite an edited `config.json` ([Deployment → Install into Opencast](./deployment.md#install-into-opencast)).
3. **Replace the three JARs** in `$OPENCAST_HOME/deploy/`: remove the old `management-ui-config-*.jar`, `management-ui-graphql-*.jar`, and `management-ui-core-*.jar`, copy in the new ones (or update the `opencast-management-ui` Karaf feature). Karaf picks up the change; with Opencast stopped, the new bundles load on the next start.
4. **Check your config still fits.** Read the release's changelog for config-affecting changes, and confirm `app.enabledPlugins` still names the right namespaces. Then reload the UI with the browser console open and watch for `config validation failed` warnings — a slice that no longer validates silently reverts to defaults ([Configuration → When a change does not take](./configuration.md#when-a-change-does-not-take)).
5. **Verify** as after a fresh deploy: the UI loads at `/management-ui/`, login works, and — if you run org plugins — `/management-tool/ui/config/plugins.json` still lists their JARs ([Deployment → Verify it works](./deployment.md#verify-it-works)).

**Coming from a pre-1.0 deployment?** Two extra steps: remove **all** old `management-ui-*.jar` bundles — the per-plugin bundles (episodes, series, upload, test) no longer exist as separate JARs; those plugins now ship inside `management-ui-core` — and rewrite your `config.json` from scratch against today's shape ([Configuration → Key reference](./configuration.md#key-reference)): the legacy keys `app.pluginNamespace` and `plugins["management-ui-<id>"]` are no longer read.

**Org plugins:** if the new host bumped the plugin runtime API **major**, deployed plugins compiled against the old version refuse to load with a clear loader error (`"Plugin requires API major X, host provides Y"`) — rebuild them against the new host before or right after the upgrade (see [below](#plugin-compatibility-for-plugin-authors)).

**Rolling back:** put the previous JARs back into `$OPENCAST_HOME/deploy/` and restore the backed-up `config.json`.

## Plugin compatibility (for plugin authors)

Every workspace package is versioned **independently** following Semver, and the public contracts (plugin manifest, runtime API, theme, config, shared runtime dependencies, GraphQL operation naming) layer additional rules on top — the authoritative list, including each contract's current version, is [`architecture/CONTRACTS.md`](../architecture/CONTRACTS.md). A change observable to a plugin author through any of these surfaces is **always a major bump** of the affected package, even if Semver alone would say otherwise.

### Patch and minor upgrades

```bash
pnpm install
pnpm verify
```

That's it. Patch and minor versions are backwards-compatible by definition. If `pnpm verify` fails after a minor bump, that's a regression in the upstream package — file an issue with the failing log.

### Major upgrades

Read the changelog first. Every breaking change ships with a `@deprecated` warning on the old symbol in the previous major, a runtime warning in dev, a changelog entry in the affected package's `CHANGELOG.md`, and an ADR if the break is architectural. Plugin authors get a **one-major-cycle grace window**: a symbol marked `@deprecated` in `1.x` can only be removed in `2.0.0`.

Version mismatches fail loudly, never silently: when the host bumps `PLUGIN_API_VERSION` major, plugins compiled against the previous major are cleanly rejected by the loader (`"Plugin requires API major X, host provides Y"`), and a plugin whose declared `apiVersion` requires a newer **minor** than the host provides is rejected too. The exact compatibility rules and the `apiVersion` field semantics are in [Contracts → Runtime API](../architecture/CONTRACTS.md#2-plugin-runtime-api-contract).

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

### Rolling back a package release

We don't `npm unpublish`. If a release goes sideways, the bad version is deprecated with `npm deprecate` and a patch ships. Consumers who pinned the bad version can downgrade in their lockfile.

## See also

- [`architecture/CONTRACTS.md`](../architecture/CONTRACTS.md) — what's frozen and what isn't.
- [`operations/release.md`](../operations/release.md) — release lines, how releases get cut.
- [`operations/open-followups.md`](https://github.com/academic-moodle-cooperation/management-ui/blob/develop/docs/operations/open-followups.md) — known issues and waiting-on-upstream items. (GitHub link — the page is deliberately excluded from the published docs site.)
