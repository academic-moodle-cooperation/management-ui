# Contribute

For people changing this repository — the shell, the shared packages, or the built-in plugins. Afterwards you'll know which page covers the step you're on.

Adding a feature for one organization is usually a plugin, not a change here: see [Extend it](../extend/index.md).

## Tasks

Two pages, in this order:

- [Set up the repo](./setup.md) — clone to a running shell with hot reload, and which backend to point it at.
- [Your first pull request](./first-pr.md) — find work, pass the gate, write the changeset, open the PR.

## Look it up

- [Full local setup](./local-backend.md) — a local Opencast with the backend bundles deployed.
- [Testing](./testing.md) — the test tiers and how to run each one.
- [CI](./ci.md) — what runs on your pull request and what makes it fail.
- [Releases](./release.md) — how a version reaches npm, and which branch a fix targets.
- [Adding a package or app](./extending-the-workspace.md) — the rarer case of a new top-level workspace member.
- [Release test protocol](./test-protocol.md) and [Recording a manual test run](./manual-test-recording.md) — the pre-release walkthrough, and how to turn a run into fixtures.

Deeper background, deliberately dense and meant for looking things up rather than reading through: [Architecture](../reference/architecture.md), [Contracts](../reference/contracts.md), [Configuration model](../reference/configuration.md), and the [architecture decision records](../reference/decisions/001-plugin-system.md).

AI agents working in this repo follow [`AGENTS.md`](../../AGENTS.md); the community expectations are in [`CODE_OF_CONDUCT.md`](../../CODE_OF_CONDUCT.md), and vulnerabilities go through [`SECURITY.md`](../../SECURITY.md).
