# Security Policy

## Supported versions

Until the first public 1.0 release of Management UI, only the latest commit on the repository's default branch and the most recent tagged pre-release are eligible for security updates. After 1.0 ships, the table below will list the supported version ranges; until then, please upgrade to the latest default-branch commit before reporting.

| Version | Supported |
| --- | --- |
| Default branch (head) | ✅ |
| Older snapshots / forks | ❌ |

## Reporting a vulnerability

**Do not open a public GitHub issue.** Public disclosure before a fix is available puts every Management UI deployment at risk.

Report security issues privately by either of:

- Using GitHub's [private vulnerability reporting](https://github.com/academic-moodle-cooperation/management-ui/security/advisories) (preferred) — opens a private advisory on this repo that the maintainers see immediately and that we use to coordinate the fix and the eventual public CVE.
- Emailing **security@academic-moodle-cooperation.at** with a description, reproduction steps, affected version (a commit SHA on the default branch is fine), and your assessment of impact.

What happens next:

1. We acknowledge receipt within **two working days**.
2. We respond with a triage assessment (severity, affected scope, ETA) within **seven working days**.
3. We coordinate the fix in a private branch and prepare a patch release.
4. Once fixed, we publish a GitHub Security Advisory describing the issue, the affected versions, the fix, and credit to the reporter (unless you ask to remain anonymous).
5. For high-severity issues we may request that you delay public discussion until downstream operators have had a reasonable window to patch (typically 14–30 days).

## Our security process

- **Supply-chain hygiene**: All GitHub Actions in `.github/workflows/` are pinned to immutable commit SHAs, and Dependabot (`.github/dependabot.yml`) opens a weekly grouped PR that bumps those pins when new action releases ship — so pinning does not mean going stale. npm dependencies are covered by Dependabot too: security advisories and a weekly grouped PR for minor/patch bumps, with majors arriving as individual PRs for deliberate review.
- **Plugin contract boundaries**: Plugins run inside the host's React tree and share its capability set. The plugin API contract (see [`docs/reference/contracts.md`](docs/reference/contracts.md)) treats every plugin's exposed surface as security-relevant; the contract-test harness ([`docs/contribute/testing.md`](docs/contribute/testing.md)) verifies that public surfaces don't drift silently.
- **Coordinated disclosure**: We follow the responsible-disclosure timeline above and prefer to credit reporters in the published advisory.
- **Secrets**:
  - Never commit secrets, API keys, or credentials.
  - Use `.env*` files (gitignored) for local development.
  - Production deployments must source credentials from the host system's secret manager or OSGi configuration.

## Scope

Security issues we consider in scope:

- Code-execution or sandbox-escape paths in the plugin loader (`apps/shell/src/services/jarPluginLoader.ts`, the marketplace `RemoteLoader`).
- Authorization bypass in `@oc-mui/router`'s route-protection layer.
- Cross-site scripting or injection in any shipped component.
- Supply-chain compromise of any package under `@oc-mui/*` once published.
- Configuration paths that allow a plugin to read or modify other plugins' state.

Out of scope:

- Vulnerabilities specific to a third-party plugin that we don't ship.
- Issues only reproducible against unsupported branches.
- Vulnerabilities in Opencast or other backend services that Management UI integrates with — report those to the relevant project.

Thank you for helping keep Management UI secure.
