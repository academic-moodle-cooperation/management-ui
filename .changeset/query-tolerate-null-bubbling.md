---
"@oc-mui/query": patch
---

A single record that violates the schema's non-null promise (for example an event without a title after a failed workflow) no longer fails the whole request. When every GraphQL error is such a null-bubbling error and the response carries data, the fetcher logs a warning and returns the partial data; lists already skip the nulled entries.
