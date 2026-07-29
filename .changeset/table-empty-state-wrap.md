---
"@oc-mui/ui": patch
---

The data table's empty-state cell now sets `whitespace-normal`, so plugin-provided empty states wrap normally instead of inheriting the cell's `whitespace-nowrap` and rendering as a single overflowing line.
