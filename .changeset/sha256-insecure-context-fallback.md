---
"@oc-mui/utils": patch
---

`sha256` no longer throws on plain-HTTP deployments: when `crypto.subtle` is unavailable (insecure contexts), it falls back to a stable cyrb53-based hex hash instead of crashing the caller (#309). The helper's contract is unchanged — non-cryptographic cache keys / stable ids; the fallback output is shorter and not SHA-256.
