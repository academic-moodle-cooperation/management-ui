---
"@oc-mui/ui": major
"@oc-mui/plugin-core": patch
"@oc-mui/plugin-core-episodes": patch
"@oc-mui/plugin-core-series": patch
---

Drop the lucide icon barrel from `@oc-mui/ui`'s public surface

`@oc-mui/ui` re-exported 37 hand-picked lucide symbols, both from
`@oc-mui/ui/components` and the `@oc-mui/ui/components/icons` subpath. They are
gone; import them from `lucide-react` instead.

**Migration:** replace the import source, nothing else.

```diff
-import { Video, ExternalLink } from "@oc-mui/ui/components/icons";
+import { Video, ExternalLink } from "lucide-react";
```

Nothing changes at runtime. The host already registers the *complete* lucide
module in its shared-module map (`apps/shell/src/shared/sharedModules.ts`), and
plugins mark `lucide-react` as external, so these imports resolve to the same
host copy the barrel resolved to.

Why remove it: 37 of ~1500 icons is an arbitrary subset that generates a
request every time someone needs the 38th, `docs/plugins/styling.md` already
prescribes importing `lucide-react` directly, and carrying two ways to do the
same thing into the first npm publish would freeze both.

`@oc-mui/ui`'s **own** icons — the hand-drawn SVGs in the `Icons` object — are
unaffected and still exported.

**Note on process:** a removal of this kind normally requires a `@deprecated`
cycle in the previous major (see `docs/operations/release.md` → Deprecations).
That step is deliberately skipped: nothing is published to npm yet, so there is
no consumer a deprecation could warn. This is the last moment the removal is
free — after the first publish it would cost a full major cycle.
