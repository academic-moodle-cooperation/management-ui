---
"@oc-mui/store": minor
---

`fileUploaded` now derives the remaining `pending` list from the store instead of taking it from the caller; the second parameter is deprecated and ignored. A list captured when an upload started was stale once other uploads had finished in between, and writing it back re-queued files that were already done. The action also never appends an undefined entry to `uploaded` any more, lists a file only once, and persisted state is cleaned of such holes on rehydration — a single `null` in the list used to crash the upload list on every render until the session storage was cleared by hand.
