---
"@oc-mui/ui": patch
---

`MetadataField` and `MetadataUpdateField` no longer crash when a list-backed metadata field arrives without its `collection`. The GraphQL schema types `collection` as nullable, but both components read it unguarded (`Object.keys` / `Object.values`), so a backend that omits the option list took down the whole episodes info panel with "Module Error". The read-only field now falls back to the raw value, the editable one to its existing "no options" branch.
