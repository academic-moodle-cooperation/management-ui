---
"@oc-mui/i18n": patch
---

`useExtensionLabels` re-resolves its labels once the requested namespaces have loaded. The hook only re-rendered on a language switch, so a host surface that renders before the plugin's own component mounts — the sidebar — kept showing the derived fallback (or a raw key such as `Playlists.Nav`) until the user navigated or changed the language.
