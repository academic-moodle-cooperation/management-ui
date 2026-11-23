---
"@oc-mui/query": patch
---

A GraphQL error on a field of a single record no longer fails the whole request. When every error's path runs through a list entry (for example one event's publication URI failing to resolve), the fetcher logs a warning and returns the partial data, so the Videos and Series tables still load. Errors that concern the request as a whole, such as an authorization failure, still fail it.
