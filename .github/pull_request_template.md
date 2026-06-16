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
- [ ] If a `@opencast-mui/*` package's public API surface changed: `pnpm api-check` regenerated, the diff in `etc/<pkg>.api.md` is intentional and committed.
- [ ] If a versioned package changed user-facing behaviour: a [Changeset](https://github.com/changesets/changesets) is included (`pnpm changeset`). Doc-only or shell/playground-only changes can skip this; CI's `Changeset` job tells you which.
- [ ] [`AGENTS.md`](../AGENTS.md) rules followed for any plugin work (extension points in `plugin.json`, contract test up to date, no cross-plugin or cross-app imports).

## Stacked / linked PRs

<!-- If this PR depends on or stacks on another, link it here. GitHub will
     auto-retarget after the parent merges. -->

## Screenshots (if applicable)

<!-- Drag-and-drop UI changes here. -->

## Notes for reviewers

<!-- Anything reviewers should look at extra-carefully — risky edges, deliberate
     deferrals, areas you'd like a second opinion on. -->
