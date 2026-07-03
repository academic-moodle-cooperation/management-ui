---
"@oc-mui/plugin-admin-marketplace": minor
---

Make remote plugin loading opt-in and fail-closed by default.

The marketplace fetches and executes third-party code at runtime, so that
capability is now off unless a deployment explicitly enables it. A new config
slice gates it:

```json
{ "plugins": { "admin-marketplace": { "remotePlugins": { "enabled": true, "allowedDomains": ["cdn.jsdelivr.net"] } } } }
```

- `remotePlugins.enabled` defaults to `false`. Every remote load — community
  install, developer URL, and the boot-time auto-load of persisted plugins —
  routes through a single fail-closed choke point in `RemoteLoader` and is
  refused when disabled.
- `remotePlugins.allowedDomains` is now deployment-configurable (previously a
  hardcoded default with the config setter unused).
- When disabled, the marketplace's Community and Developer sections render a
  clear "how to enable" banner and the developer URL loader is visibly disabled;
  bundled, organization (JAR), and local plugins are unaffected.
- Hardened the HTTPS check: the plaintext-HTTP exception for localhost now
  applies only in development, so a production build can't be pointed at
  `http://localhost` to serve plugin code.

Note: this changes the default behavior — a deployment that relied on the
community/developer marketplace must set `remotePlugins.enabled: true`.
