---
"@oc-mui/plugin-testing": patch
---

README no longer hard-codes contract version pairs (one of which had already drifted) — the versions live in `docs/architecture/CONTRACTS.md`, enforced by the new `pnpm docs:ownership` check.
