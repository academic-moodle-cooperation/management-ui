---
---

Docs: note in `docs/plugins/i18n.md` that adding or renaming a locale key
requires restarting `pnpm dev` — i18next loads each namespace once at init
and doesn't hot-reload locale JSON, so a new key renders as its raw key
until restart (a production build always has the current keys). A common
dev-loop confusion, surfaced while diagnosing a raw `authError.title` on a
running dev server. Docs-only.
