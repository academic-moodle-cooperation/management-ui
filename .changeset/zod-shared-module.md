---
"@oc-mui/plugin-system": minor
"@oc-mui/remote-plugin-loader": minor
"@oc-mui/vite-config": minor
---

`zod` (major 4) is now a shared runtime dependency: the host exposes one copy, the remote-plugin loader rewires `zod` imports to it, and `createCommunityPluginConfig` externalizes it by default. `definePluginConfig` takes a zod schema, so plugins already had to agree with the host on zod; they now consume the host's copy instead of bundling their own. Plugins built before this keep working (same major). Shared Runtime Dependencies Contract 1.0 → 1.1.
