---
"@oc-mui/ui": patch
---

Fix `OverflowTooltip` permanently latching the dotted "truncated" underline when a web font loads after first paint.

The first overflow measurement runs synchronously in the element's `ref` callback on mount, which can happen while a fallback font is still in place — web fonts load asynchronously. The fallback's metrics differ, so a clamped multi-line cell (e.g. the episodes table's `contributors`/`presenters` columns) can momentarily report a vertical overflow it does not actually have once the real font swaps in. The previous logic only ever set the `overflowingVertical`/`needsTooltip` flags to `true`, so that false positive latched the underline on permanently and nothing ever cleared it.

`OverflowTooltip` now re-asserts both flags on every measurement (so a later, correct measurement can clear a false positive) and re-measures once `document.fonts.ready` resolves. This removes the intermittent "every cell is underlined" rendering that showed up when an organization ships custom self-hosted fonts.
