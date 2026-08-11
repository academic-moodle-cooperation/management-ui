---
"@oc-mui/query": minor
"@oc-mui/plugin-core-episodes": patch
"@oc-mui/plugin-core-series": patch
---

Only submit metadata fields the organization's GraphQL input type accepts (#278, #280)

Opencast derives `CommonEventMetadataInput` / `CommonSeriesMetadataInput` per
organization from the catalog UI adapter config: a `readOnly=true` property is
absent from the input type, and submitting it is a hard ValidationError. The
committed codegen types are a one-server snapshot and can only ever be a
superset, so saving metadata failed entirely on deployments whose catalog
config trims a field (`location` on events, `creator` on series).

- `@oc-mui/query` gains `useAcceptedInputFields(typeName)` — introspects the
  org's input type once per session (cached, fail-open when introspection is
  disabled) — and the pure `pickAcceptedFields(metadata, accepted)` filter.
- The episodes and series edit forms no longer seed server-read-only fields
  into the update payload and filter the mutation input against the accepted
  set as a last line of defence.
- The create-series dialog hides metadata fields the organization does not
  accept and filters its mutation input the same way.
