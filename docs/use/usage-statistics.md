# See how videos are watched

> **Task page.** Where the numbers on the **Statistics** page and the **Usage** tab come from, and what they mean.

Open **Statistics** in the left navigation. The page covers the recordings you own, newest first:

- **Total views**, **Episodes** (how many have been watched at all), and **Average completion** — the share of plays that reach the final part of a video.
- **Most watched** — the leaderboard.
- **All episodes** — one row per recording with views, a *views over time* sparkline, completion, a *watched parts* curve, and the last viewing date.

The same numbers for a single recording sit in the **Usage** tab of its panel: open **Videos**, click the row, choose **Usage**.

## Where the numbers come from

The badge at the top right names the source. The plugin tries, in order:

1. **Opencast statistics** — the statistics providers an operator configured in Opencast (typically backed by Matomo). Gives views and views over time.
2. **Opencast usertracking** — the player's position tracking, when that module is deployed. Gives views and which parts were watched.
3. **Demo data** — generated locally, the same every time, so the page still shows what it *would* look like. Nothing is real.

A dash (–) means the active source does not record that measure: aggregated statistics do not know which parts were watched, and usertracking has no timeline.

Operators choose the source and the time window in the plugin's config slice — see [`plugins/usage-stats/README.md`](../../plugins/usage-stats/README.md).
