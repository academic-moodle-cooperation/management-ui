---
"@oc-mui/eslint-config": patch
---

Dependency maintenance: `globals` 16 → 17 (the browser and service-worker global lists the React config spreads; the 17.0 break only splits `audioWorklet` out of `browser`, which the config does not use).
