# Marketplace design studies

Four standalone, self-contained HTML prototypes from the marketplace redesign
exploration (August 2026). They are **design references, not product code**:
they use external web fonts and hardcoded colors on purpose, so none of the
repo's styling rules apply to them and nothing here is shipped or linted.
Open any file directly in a browser; each one runs on mock data.

| File | Direction | Notes |
|---|---|---|
| `v1-editorial.html` | Warm paper, serif headlines, App-Store-style curation | First study; the "warm paper" light palette fed into the Ember theme |
| `v2-console.html` | Dark warm console, compact card grid, +/✓ gestures | Modelled on a connector-directory UI; the anthracite palette fed into Ember dark |
| `v3-community.html` | Media-rich community store: thumbnails, avatars, social stats | Modelled on a design-community store |
| `v4-hybrid.html` | V3 showcase on the V2 skin, with the V2 library view | The chosen direction for `plugins/admin-marketplace-v2`; not final — a mix with the others is still open |

What has been implemented so far follows V4: the Discover catalog, the Try
gesture, and the **Ember** showcase theme
(`apps/shell/public/plugins/themes/ember.css`) which carries V4's color
language as semantic tokens. Decisions about the remaining UI (library,
curation, theme try-on) are still being made feature by feature — see
[`INTENT.md`](../../INTENT.md) for the intent these studies serve.
