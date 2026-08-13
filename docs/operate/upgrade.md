# Upgrade

For Opencast admins. Afterwards you'll have moved a deployment to a newer version and know which version pairs with which Opencast.

## Which version am I running?

**Ask the app first.** Every page has a footer reading `Management UI v<version> · <commit>`, where the commit links to the exact revision on GitHub. Both are stamped in at build time: the version from the release line's `VERSION` file, the short SHA from the build checkout. That pair identifies a deployment even when nothing was ever released from it — which is why it beats the filenames below.

If the footer shows a version but no commit, the build had no git metadata available; a version of `dev` means the `VERSION` file could not be read at build time.

**The JAR filenames are the fallback**, for when you cannot open the UI:

```bash
ls "$OPENCAST_HOME"/deploy/management-ui-*.jar
```

Released artifacts carry the **product version** in the name: the `r/20.x` line's `VERSION` is `20.0.0`, so its bundles are `management-ui-core-20.0.0.jar` and its two siblings. A build from an unreleased checkout carries Maven's snapshot version (`1.0-SNAPSHOT`) instead — every JAR on such a server reads `1.0-SNAPSHOT` no matter which commit it came from, so the filenames stop being an answer and the footer is the only one left.

The product version's major is pinned to the Opencast major it targets, and each release line is maintained on its own `r/NN.x` branch. Upgrading inside a line means following that line's newest tag; moving to a new Opencast major means switching lines and rebuilding the bundles, because a bundle built for one major refuses to start on another. The model — lines, the `VERSION` file, tags, forward merges — is [Releases & versioning → Release lines and the product version](../contribute/release.md#release-lines-and-the-product-version).

## The upgrade

1. **Build the new version.** Check out the tag or release-line branch you are moving to and build it as in [Install → Build and deploy](./install.md#build-and-deploy). There are no prebuilt JARs. **Keep the old JARs** — they are your rollback.
2. **Back up your config**: `$OPENCAST_HOME/etc/ui-config/mh_default_org/management-ui/config.json`. Deploying with `-DdeployTo` can overwrite it.
3. **Replace the three JARs** in `$OPENCAST_HOME/deploy/`: remove the old `management-ui-config-*.jar`, `management-ui-graphql-*.jar`, and `management-ui-core-*.jar`, then copy in the new ones — or update the `opencast-management-ui` Karaf feature. A running Karaf picks the change up; a stopped Opencast loads them on the next start.
4. **Check your config still fits.** Read the release notes for config-affecting changes, confirm `app.enabledPlugins` still names the right namespaces, then reload the UI with the browser console open: a slice that no longer validates reverts to defaults with nothing but a warning ([Configure → When a change does not take](./configure.md#when-a-change-does-not-take)). Check the [backend keys](./backend-config.md) too — `trash.workflow.id` in particular, since losing it makes deletion permanent.
5. **Verify** exactly as after a fresh install: the UI loads at `/management-ui/`, login works, and — if you run organization plugins — `/management-tool/ui/config/plugins.json` still lists their JARs ([Install → Verify](./install.md#verify)).

## Coming from a pre-1.0 deployment

Two extra steps, both easy to miss:

- **Remove *all* old `management-ui-*.jar` bundles**, not just the three named above. The per-feature bundles (episodes, series, upload, test) no longer exist separately — those plugins now ship inside `management-ui-core`, so anything left over is a stale bundle.
- **Rewrite `config.json` against today's shape.** The legacy keys listed in [Configuration model → Migration notes](../reference/configuration.md#for-deployments-that-still-use-legacy-keys) are simply not read anymore — no error, no warning, just no effect. [Configure](./configure.md) shows what a current file looks like.

## Rolling back

Put the previous JARs back into `$OPENCAST_HOME/deploy/` and restore the backed-up `config.json`. That is the whole procedure — which is why step 1 says to keep both.

## Organization plugins

If the new host raised the plugin runtime API's major version, plugins compiled against the old one refuse to load and say so (`"Plugin requires API major X, host provides Y"`). Rebuild them against the new host before or right after the upgrade; the compatibility rules are in [Contracts](../reference/contracts.md#2-plugin-runtime-api-contract).
