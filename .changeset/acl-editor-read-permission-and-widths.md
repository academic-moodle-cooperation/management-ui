---
"@oc-mui/ui": patch
---

fix(ui): state the AclEditor's read-permission rule and fix its column widths

The read checkbox was hardcoded `disabled` while still wired to a change
handler that could never fire, leaving it unclear whether read was meant to be
unremovable or the `disabled={disabled}` of the write column had been
forgotten. It is deliberate: a new entry is created with `["read"]` and access
is revoked by deleting the row, so being listed *is* read access. The dead
handler is gone and the checkbox now carries a label saying so.

Also adds a floor: an entry can no longer end up granting nothing. Read
normally holds it, but a backend-supplied entry can carry write without read,
where unchecking write produced `action: []` — a row that reads as access in
the list while granting none. Such an entry is rendered as it arrives; read is
deliberately not added on load, which would be an unrequested permission change
written back on the next save.

The table's column widths declared `w-1/2 + w-1/4 + w-1/4 + w-1/3` = 133%.
`table-fixed` normalised that proportionally, so the rendered columns never
matched the written ones. Now `w-1/2 + 3 × w-1/6` = 100%.
