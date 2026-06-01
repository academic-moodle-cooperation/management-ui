---
---

Docs: correct test-protocol §9.4. The scaffolded placeholder plugin
registers `app:header-logo`, but nothing in the core renders that
extension point, so there is **no** visual change when the plugin loads
(the header logo does not swap — verified in a running shell). Replace
the inaccurate "logo placeholder appears in the header" guidance with the
fact that the activation console line is the only signal, and that a real
plugin renders its own UI. Docs-only; empty changeset.
