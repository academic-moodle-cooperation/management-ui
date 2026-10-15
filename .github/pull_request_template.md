## What and why

<!-- One or two sentences. Link the issue. -->

## Release lines

<!-- Pick one — see docs/contribute/release.md → Branching model. -->

- [ ] Opencast-agnostic: the next `develop → r/NN.x` sync carries it to every supported line.
- [ ] Needs Opencast NN or newer: labelled `ocNN-only` (release.md → *Features that need a newer Opencast major*).
- [ ] Bugfix landed on a release line: forward-merge chain (release.md → *Bugfixes across multiple release lines*).

## Pre-flight

- [ ] Changeset committed for every versioned package touched; `pnpm api-check` run if a public `@oc-mui/*` surface changed.
- [ ] Docs that name what this changes are updated in this PR (AGENTS.md → pre-flight item 8).
- [ ] `pnpm verify` green locally.
