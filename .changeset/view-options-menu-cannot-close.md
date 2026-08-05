---
"@oc-mui/ui": patch
---

fix(ui): let the column menu close while the pointer is inside it

`DataTableViewOptions` was a controlled dropdown whose `onOpenChange` was
ignored entirely while a `preventEditClose` flag was set — and that flag was
set on the content's `onMouseEnter`/`onClick` and only cleared on
`onMouseLeave`. As long as the pointer rested inside the menu, no close signal
was honoured: neither Esc nor an outside click, while the Radix overlay kept
swallowing every click on the rest of the page.

The menu is now uncontrolled, so Radix handles Esc and outside clicks itself.
Staying open across column toggles — the behaviour the workaround was after —
is expressed per item via `onSelect={(event) => event.preventDefault()}`.
