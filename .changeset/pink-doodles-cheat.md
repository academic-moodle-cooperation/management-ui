---
---

Add `docs/operations/test-protocol.md` — an end-to-end checklist to run
before each release. Sections cover workspace baseline, shell boot,
built-in plugin features, GraphQL data flow, i18n, configuration,
theming, the three `pnpm create-plugin` modes, `.local-plugins/` dev
loading, Maven JAR build + deployment, marketplace CDN load,
contracts enforcement, CI gates, the documentation site, and
authentication.

Wired into `docs/.vitepress/config.mts` (Operations sidebar) and
cross-linked from `docs/README.md` and `docs/operations/release.md`.
The release-flow doc now points readers at the protocol as the
integration-level gate that complements `pnpm verify`'s mechanical
checks.

No package code touched; empty changeset records the doc-only nature.
