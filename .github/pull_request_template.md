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

- [ ] `pnpm verify` passes locally (lint + check-types + build + unit + contract + api-check + Playwright smoke).
- [ ] If *any* versioned package changed (all of `packages/*` and `plugins/*`, private ones included): a [Changeset](https://github.com/changesets/changesets) is **committed** (`pnpm changeset`). Only `.github/`/doc-only or shell/playground-only changes can skip this; CI's `Changeset` job tells you which.
- [ ] If a `@oc-mui/*` package's public API surface changed: `pnpm api-check` regenerated, the diff in `etc/<pkg>.api.md` is intentional and committed.
- [ ] Docs this PR makes stale are updated in the same PR.
- [ ] [`AGENTS.md`](../AGENTS.md) rules followed for any plugin work (extension points in `plugin.json`, contract test up to date, no cross-plugin or cross-app imports).
- [ ] **Reviewer:** base branch matches the oldest affected Opencast major (`r/NN.x` for released-line fixes, `develop` for next-major work).

## Stacked / linked PRs

<!-- If this PR depends on or stacks on another, link it here. GitHub will
     auto-retarget after the parent merges. -->

## Screenshots (if applicable)

<!-- Drag-and-drop UI changes here. -->

## Notes for reviewers

<!-- Anything reviewers should look at extra-carefully — risky edges, deliberate
     deferrals, areas you'd like a second opinion on. -->
