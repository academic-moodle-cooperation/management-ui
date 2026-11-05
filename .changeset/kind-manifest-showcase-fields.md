---
"@oc-mui/plugin-system": minor
---

Plugin Manifest Contract 1.2: two optional, presentational fields join `icon`
and `screenshots` in `plugin.schema.json` — `tagline` (one-line pitch) and
`accentColor` (any CSS color for the marketplace tile). The runtime validator
type-checks `icon`, `tagline` and `accentColor` as strings when present. No
loader behaviour changes.

The object registry builtin gains `registry.getTypes` (every extension point
that received a registration), so tooling can walk all points — the
marketplace uses it to show what each plugin on a deployment extends.


The tab-scoped preview contract gains its mirror image, **pauses**:
`readPluginPauses` / `writePluginPauses` / `addPluginPause` /
`removePluginPause` (sessionStorage key `mui.plugin-pauses`). A paused
namespace is enabled on the deployment but skipped by the host in this tab —
so a trial of a plugin that fills the same slots (footer, landing page,
sidebar, …) can be seen without the two fighting. The shell honours it at
every load gate; the marketplace writes it with the trial and clears it when
the trial ends.
