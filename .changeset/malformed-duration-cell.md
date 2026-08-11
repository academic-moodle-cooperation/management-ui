---
"@oc-mui/utils": patch
---

`parseDuration` no longer throws on non-ISO input

A single event whose `duration` was not valid ISO 8601 (e.g. a raw
millisecond number) threw inside the table cell renderer, and the nearest
error boundary unmounted the entire Videos page (#253). `parseDuration`
now returns the raw value for input tinyduration cannot parse — one odd
cell instead of a dead module. Valid durations format as before;
undefined/empty still yields `00:00:00` (rendered as ∞ by callers).
