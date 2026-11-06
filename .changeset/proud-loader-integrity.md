---
"@oc-mui/remote-plugin-loader": minor
---

`loadAndRegister` accepts an optional SRI-style `integrity` option
(`sha256-|sha384-|sha512-<base64>`). When set, the fetched bundle's raw bytes
are hashed and compared before any transform or import — a mismatch (or a
malformed value) aborts the load. `parseIntegrity`/`verifyIntegrity` are
exported for callers that need the primitives.
