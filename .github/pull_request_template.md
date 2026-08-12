## Summary

<!-- One or two sentences: what does this PR do, and why? -->

## Type of change

- [ ] 🚀 Feature
- [ ] 🐛 Bug fix
- [ ] 🧹 Refactor
- [ ] 📝 Docs
- [ ] 🧪 Tests / CI
- [ ] 🔧 Tooling / build

## Before-merge checklist

- [ ] `pnpm verify` passes locally — the canonical gate; the step list lives in [AGENTS.md → Pre-push gate](https://github.com/academic-moodle-cooperation/management-ui/blob/develop/AGENTS.md#pre-push-gate--pnpm-verify).
- [ ] If *any* versioned package changed (every package under `packages/*` and `plugins/*`, private ones included): a [Changeset](https://github.com/changesets/changesets) is **committed** (`pnpm changeset`). PRs touching only docs, `.github/`, or root config touch no package and need none. The authoritative rule and its only exemptions: [AGENTS.md → Versioning](https://github.com/academic-moodle-cooperation/management-ui/blob/develop/AGENTS.md#versioning--changesets-every-versioned-package-and-public-api-changes).
- [ ] If a `@oc-mui/*` package's public API surface changed: `pnpm api-check` regenerated, the diff in `etc/<pkg>.api.md` is intentional and committed.
- [ ] Docs this PR makes stale are updated in the same PR.
- [ ] [AGENTS.md](https://github.com/academic-moodle-cooperation/management-ui/blob/develop/AGENTS.md) rules followed for any plugin work (extension points in `plugin.json`, contract test up to date, no cross-plugin or cross-app imports).
- [ ] **Reviewer:** base branch matches the oldest affected Opencast major (`r/NN.x` for released-line fixes, `develop` for next-major work — see [Releases & versioning](https://github.com/academic-moodle-cooperation/management-ui/blob/develop/docs/operations/release.md)).

## Stacked / linked PRs

<!-- If this PR depends on or stacks on another, link it here. GitHub will
     auto-retarget after the parent merges. -->

## Screenshots (if applicable)

<!-- Drag-and-drop UI changes here. -->

## Notes for reviewers

<!-- Anything reviewers should look at extra-carefully — risky edges, deliberate
     deferrals, areas you'd like a second opinion on. -->
