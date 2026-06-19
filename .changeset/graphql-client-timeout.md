---
"@oc-mui/query": patch
---

GraphQL client: apply a default per-request timeout (15s) so an
unreachable-but-routed backend (e.g. VPN up, host down) surfaces as a prompt
error instead of leaving queries pending forever — which previously left the
auth gate spinning on "Checking authentication…" indefinitely. The wrapper is
internal to the client; no public API change.
