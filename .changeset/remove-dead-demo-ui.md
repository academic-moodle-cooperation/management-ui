---
"@oc-mui/ui": patch
---

Remove five exported-but-unused demo/debug components from `@oc-mui/ui`:
`appshell/components/{nav-projects,team-switcher}.tsx` (shadcn sidebar
boilerplate with hardcoded "Projects"/"Teams" content) and
`auth-status/{AuthStatus,AuthMethodsDemo,AuthDebug}.tsx` (auth debug
scaffolding). All five were rendered nowhere in the shipped app and
reachable only via wildcard subpath exports — confirmed zero consumers
repo-wide — so they were dead exported surface (an a11y/i18n liability
for an OSS package). No real consumers exist (the package is unpublished
until the 1.0 cut), so this is a patch.

Bonus: the `auth-status/*` components were one arm of the
`@oc-mui/ui → @oc-mui/router` dependency inversion (open-followups §3.5);
removing them shrinks that tangle. Closes open-followups §3.6.
