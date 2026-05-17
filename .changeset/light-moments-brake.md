---
---

Phase 8.5.2 — external plugin Maven POM template.

`pnpm create-plugin <name>` now scaffolds a `backend/` Maven layout
alongside the frontend by default. The scaffolded POM inherits from
`org.opencastproject:base:19-SNAPSHOT`, runs `pnpm build` via
`frontend-maven-plugin`, copies the result into a `static/plugins/<id>/`
tree, and packages everything as an OSGi bundle Opencast's
`PluginBundleTracker` discovers.

New flag `--no-pom` skips the Maven layout for plugins that will only
ever be distributed via CDN. `--in-tree` continues to skip it
automatically (those plugins ship inside the shell's JAR, not their own).

The previous example at `examples/community-plugin-template/` is retired
— the scaffolded output from `pnpm create-plugin` is now the canonical
template. `examples/` is deleted; the `apps/playground/README.md`
reference was updated to point at `plugins/example/` and
`pnpm create-plugin` instead.

`docs/plugins/distribution.md` § Path 3 (JAR) is expanded from a five-
bullet summary into a full how-to: scaffolding, build, deploy, OSGi
header table, the in-Maven `pnpm build` step and how to skip it, and
the `-DdeployTo=$OPENCAST_HOME` install convenience.

`docs/operations/open-followups.md` updates:
- §1.1 closed (template retired).
- §1.2 closed (POM template shipped).
- New §1.3 captures the deferred "publish a `management-ui-plugin-parent`
  POM" option — sized at ~1 day with cheap-now / expensive-later tradeoff
  spelled out, plus the trigger conditions for revisiting.
- §8.2 dropped (it duplicated §1.1).

No published package versions touched; empty changeset records the
scaffold-only nature of the change.
