---
"@oc-mui/ui": patch
---

`OverflowTooltip` no longer underlines every cell when an org theme swaps in a corporate font.

The vertical-overflow check compared `clientHeight < scrollHeight` exactly. A font whose ascenders and descenders are taller than the line box makes those differ by a pixel or two on a single line that visibly fits — so in a `truncate` (nowrap) column, *every* cell got the dotted "content is cut off" underline as soon as a theme like univie's applied its self-hosted fonts. The check now requires the difference to exceed a few pixels, which only a genuinely clamped line does.

It also re-measures on `ResizeObserver` in addition to `document.fonts.ready`. `fonts.ready` settles once, covering the fonts pending at that moment; a plugin theme loaded at runtime registers its `@font-face` rules afterwards, so its font swap never re-triggered a measurement. The observer also covers column resizes and zoom changes.
