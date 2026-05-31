---
---

Scaffold: the generated plugin now logs activation/deactivation via
`logger.info` instead of `logger.debug`. `logger.debug` maps to
`console.debug`, which Chrome DevTools hides unless you enable the
"Verbose" filter — so a freshly-scaffolded plugin appeared not to
activate even when it had loaded correctly. `logger.info` shows at the
default console level, making "did my plugin load?" obvious on first run.

Also clarifies test-protocol §9.4: the expected console line is now
`[INFO] [demo-local] activated`, and a note explains that seeing neither
the line nor the placeholder logo means `demo-local` isn't in the
*served* config's `app.enabledPlugins` (re-check §9.3).

Scaffold-template + docs only, no package code. Empty changeset records
the nature of the change.
