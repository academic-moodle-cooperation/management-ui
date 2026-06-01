---
---

Docs: correct test-protocol §10.6 (and a note on §11.3). §10.6 said the
staging shell's console "shows `[demo-local] activated`", but staging is a
production build where `logger.info` is suppressed by design — so that
line never appears. Replace it with the real production signals (the
JAR's bundle served with a JS content-type, no load error, the plugin's
actual effect) and a warning not to test through a local dev server
pointed at the backend (which can't serve the JAR's `/static/plugins/`
assets and yields a spurious "returned HTML" error). §11.3 gets the same
dev-vs-prod activation-line caveat plus a reminder to use a plugin not
already loaded (else you hit a duplicate-registration skip).

Docs-only.
