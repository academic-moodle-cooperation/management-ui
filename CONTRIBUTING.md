# Contributing to Management UI

Management UI is a modular, plugin-first admin interface for [Opencast](https://opencast.org): a thin shell hosts routing, auth, and layout, and every visible feature ships as a plugin. Organisations customize by adding plugins and themes, not by forking.

**The contributor path lives in the docs, one page per step:**

- [Contribute](docs/contribute/index.md) — the map of everything below.
- [Set up the repo](docs/contribute/setup.md) — clone to a running shell with hot reload.
- [Your first pull request](docs/contribute/first-pr.md) — find work, pass the gate, write the changeset, open the PR.
- [Testing](docs/contribute/testing.md) · [CI](docs/contribute/ci.md) · [Releases](docs/contribute/release.md) — the reference pages behind those steps.

Building something for one organisation — a branded theme, an LMS integration, a custom upload flow — is a plugin rather than a change here: start at [Extend it](docs/extend/index.md).

AI coding agents follow [`AGENTS.md`](AGENTS.md), which is also the fastest human pre-flight checklist: it owns the [`pnpm verify` step list](AGENTS.md#pre-push-gate--pnpm-verify) and the changeset rule.

<a id="versioning-changesets-and-deprecations"></a>

## Versioning, changesets, and deprecations

Every change to a versioned package needs a **committed** changeset. The rule and its only exemptions live in [AGENTS.md → Versioning](AGENTS.md#versioning--changesets-every-versioned-package-and-public-api-changes); the walkthrough is [Your first pull request → Add a changeset](docs/contribute/first-pr.md#4-add-a-changeset), and the deeper reference — bump levels, API reports, the deprecation policy, release lines — is [Releases & versioning](docs/contribute/release.md).

## Conduct and security

We follow the [Contributor Covenant](CODE_OF_CONDUCT.md). Vulnerabilities go through [`SECURITY.md`](SECURITY.md) and never into a public issue.

Thank you for contributing to Management UI.
