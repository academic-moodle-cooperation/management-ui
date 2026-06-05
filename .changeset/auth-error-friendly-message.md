---
"@oc-mui/i18n": patch
---

Backend-down auth UX (§5.5): the "Couldn't verify your session" screen no
longer dumps the raw GraphQL client error — a verbose blob that includes the
operation text — directly at the user. It's now tucked behind a collapsible
"Show technical details" (new i18n key `authError.showDetails`, en/de) so an
admin can still expand it to debug.
