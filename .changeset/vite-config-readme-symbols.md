---
"@oc-mui/vite-config": patch
---

Fix stale symbol names in the package README: the usage examples showed
`shellConfig`, `communityPluginConfig`, and `baseConfig`, which don't exist —
the real exports are `createShellAppViteConfig`, `createCommunityPluginConfig`,
and `createBaseConfig`. Examples now match the actual signatures, and the
internal-plugins section mentions `coldStartHintPlugin`. Docs-only; no runtime
change.
