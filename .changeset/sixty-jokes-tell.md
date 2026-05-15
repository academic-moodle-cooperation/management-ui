---
---

Restore `docs/checkstyle/` directory that was incorrectly deleted in PR-3a
(the docs/ restructure). The directory looks like documentation but it's
actually Maven build-time configuration referenced by the
`org.opencastproject:base` parent POM at a hardcoded path. Without it,
`mvn package` fails during checkstyle execution and the project can't be
packaged as a deployable OSGi JAR.

All 8 original files restored byte-for-byte from before the PR-3a deletion:

- `opencast-checkstyle.xml` — the checkstyle ruleset
- `checkstyle-suppressions.xml` — per-rule suppressions
- `opencast-header.txt` — required license header
- `maven-dependency-plugin.exceptions` — empty marker file
- `eslintrc.js`, `html-linter.json` — frontend-maven-plugin configs
- `check-config.sh`, `check-docs.sh` — helper scripts

Added a new `docs/checkstyle/README.md` explaining what the directory is
and why it can't be moved (the parent POM hardcodes the path). VitePress
config updated to exclude the directory from the published doc site.

Tracked a follow-up in `docs/operations/open-followups.md` §8.5 to move
this out from under `docs/` cleanly once the AMC Maven workflow can
coordinate the parent-POM override with Opencast upstream.

No package code touched. Empty changeset records the build-fix nature of
the change.
