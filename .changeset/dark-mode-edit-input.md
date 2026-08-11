---
"@oc-mui/ui": patch
---

Metadata edit fields are readable in dark mode

The edit inputs in the metadata sidebar (`MetadataUpdateField`) carried
hardcoded palette classes — `text-gray-900`, gray borders/rings, indigo
focus — so in dark mode the edited value rendered near-black on a dark
background (#279). The overrides are removed; the fields now inherit the
base Input/Textarea semantic-token styling (which the theme rule mandates
anyway), and the separator hint uses `text-muted-foreground`. Verified by
a new E2E spec that measures the computed text color of the edit input in
dark mode.
