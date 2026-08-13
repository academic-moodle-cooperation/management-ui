# Maven build-time configuration

**This directory is not documentation.** Despite living under `docs/`, the files here are referenced by the **Maven build** when the project is packaged as an Opencast OSGi bundle. The path `docs/checkstyle/` is what the upstream `org.opencastproject:base` parent POM expects — moving or renaming these files breaks the JAR-packaging pipeline that the Opencast deployment depends on.

## What's here

| File | Used by |
|------|---------|
| `opencast-checkstyle.xml` | The checkstyle ruleset enforced by `maven-checkstyle-plugin:check` during the Maven build. |
| `checkstyle-suppressions.xml` | Per-file / per-rule suppressions for the ruleset above. |
| `opencast-header.txt` | Required license header that checkstyle validates is present at the top of every source file. |
| `maven-dependency-plugin.exceptions` | Empty placeholder; consumed by `maven-dependency-plugin` rules upstream. |
| `eslintrc.js` | Legacy ESLint config consumed by the Maven build's `frontend-maven-plugin` step. Not the active JS lint config (that's `packages/eslint-config/`). |
| `html-linter.json` | HTML linter config used in the same Maven step. |
| `check-config.sh`, `check-docs.sh` | Build-time shell scripts invoked by Maven goals. |

## Why it matters

The Opencast parent POM (`org.opencastproject:base`) declares the checkstyle plugin with paths anchored at the project root — specifically `${project.basedir}/docs/checkstyle/checkstyle-suppressions.xml` and similar. If these files are missing, `mvn package` (the step that produces the JAR for `$OPENCAST_HOME/deploy/`) fails at the checkstyle execution.

## Don't

- Don't move this directory. The Opencast parent POM hardcodes the path.
- Don't delete files individually. The Maven goals fail loudly when any of these are missing.
- Don't surface this directory in the VitePress doc site — it's not documentation. It's already excluded by VitePress's `srcExclude` (markdown-only) and won't appear in published docs.

## Future direction

A cleaner long-term answer would be to override `checkstyle.suppressions.file` and friends in the workspace `pom.xml` to point at a folder under, say, `build-config/` — but that's a Maven-side change that needs coordination with the Opencast upstream. Tracked in [`docs/reference/open-followups.md`](../reference/open-followups.md).
