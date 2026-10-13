---
"@oc-mui/ui": minor
"@oc-mui/i18n": minor
---

`SortableList` — a vertically sortable list for `@oc-mui/ui`. Pointer drag via a handle the list renders for every row, full keyboard reordering (space to pick up, arrow keys to move, space to drop, escape to cancel) and screen-reader announcements for each step, built on `@dnd-kit`. It is controlled: `items` is the order, `onReorder` hands back the next one together with the move, so the consumer decides whether a move saves immediately or is staged. `moveItem` is the matching pure helper for "move up / move down" menus. The handle label, instructions and announcements come from new `sortableList.*` keys in the shared `common` namespace of `@oc-mui/i18n` (en, de).
