# Usage Statistics plugin

Answers two questions a creator keeps asking: **how often was my video watched?** and **which parts did people actually see?**

It registers

- the `/usage-stats` overview page (summary tiles, a "most watched" leaderboard, and a table of the user's episodes) plus its sidebar entry,
- a **Usage** tab in the episodes table's detail panel (`table-sidebar:episodes:tabs`), and
- its config slice under `config.plugins["usage-stats"]`.

## Where the numbers come from

Three providers, probed in this order when `source` is `auto`:

| Provider | Endpoint | Gives | When it is used |
|---|---|---|---|
| `statistics` | `GET /api/statistics/providers`, `POST /api/statistics/data/query` — the Statistics External API | plays per day, totals, last-viewed date | an episode-level `timeseries` provider is configured in `etc/statistics/` (Matomo or InfluxDB) and the session holds `ROLE_API_STATISTICS_VIEW` |
| `usertracking` | `GET /usertracking/{stats,footprint}.json` | totals **and** per-position footprints ("which parts were watched") | the usertracking module is deployed |
| `demo` | — | deterministic, id-seeded data for everything above | neither service answers; the UI labels it "Demo data" |

The in-video profile is a plain SVG area chart (`components/WatchProfile.tsx`) — no charting library, because none is wrapped behind an `@oc-mui/*` facade.

## Config

```json
{
  "plugins": {
    "usage-stats": {
      "source": "auto",
      "limit": 50,
      "segments": 20,
      "historyDays": 90,
      "statisticsBaseUrl": "/api/statistics",
      "usertrackingBaseUrl": "/usertracking"
    }
  }
}
```

Set `"source": "demo"` to force the generator (screenshots, workshops), or `"statistics"` / `"usertracking"` to surface a misconfigured service as an error instead of silently falling back.

## Dev loop

```bash
pnpm --filter @oc-mui/plugin-usage-stats test            # unit tests (providers, stats maths)
pnpm --filter @oc-mui/plugin-usage-stats test:contract   # plugin contract
pnpm dev                                                 # shell at /management-ui/, entry "Statistics"
```

With `VITE_PROXY_TARGET` set, `/api` and `/usertracking` are proxied to the backend; the backend's `config.json` must list `usage-stats` in `app.enabledPlugins` (or use `VITE_LOCAL_CONFIG=true` with the local one).
