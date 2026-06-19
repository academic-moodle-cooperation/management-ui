---
"@oc-mui/ui": patch
"@oc-mui/i18n": patch
---

i18n: translate the error pages and the login form (en + de).

Previously hardcoded English: the `@oc-mui/ui` error pages (`NotFoundError`,
`UnauthorisedError`, `ForbiddenError`, `GeneralError`) and the shell's
`ModuleErrorFallback` + `LoginForm`. They now read from the `common`
namespace via `useTranslation`, with matching `en`/`de` key sets added under
`common.auth.*` and `common.errors.*`. No component prop/API changes.

First installment of a broader untranslated-string sweep; remaining shipped
surfaces (ConfigLoadError, datatable empty state, landing page, sidebar a11y
strings, MetadataUpdateField, and the `@oc-mui/router` auth/protection
fallbacks) follow.
