---
"@oc-mui/ui": patch
---

The main navigation resolves plugin-registered titles through `useExtensionLabels` instead of its own inline `i18n.exists ? t : raw` copy. One visible improvement: the resolver loads a title's namespace itself, so an org plugin's nav item no longer shows its raw translation key until some component of that plugin happens to mount. A title whose key is genuinely missing now falls back to a caption derived from the key ("common:some-entry" → "Some Entry") instead of the raw key.
