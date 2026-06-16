---
---

Phase 5 PR-B: introduce API Extractor for the contract-stable packages
`@opencast-mui/plugin-system`, `@opencast-mui/i18n`, and `@opencast-mui/ui-config`.
Each package now ships a committed `etc/<pkg>.api.md` snapshot, and CI
fails when the public API surface drifts without an accompanying update.

Three other contract-stable packages (`router`, `query`, `store`) need a
small workspace-deps refactor before api-extractor can resolve their
transitive `.ts` imports — tracked as a Phase 5 follow-up and intentionally
out of scope for this PR. See CONTRIBUTING.md "API surface drift detection"
for the workflow.

No public-API behaviour change in this PR; the version bump is recorded
through this empty changeset to keep the pipeline honest.
