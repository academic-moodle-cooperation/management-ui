# Admin Dashboard Plugin

Admin-only dashboard for operational insights and statistics.

## Features

- Admin-only route at `/admin/dashboard`
- Statistics tab with GitHub commit and code change timeline
- Placeholder tabs for metrics and admin tools

## Configuration

You can configure the GitHub repository in your app config:

```json
{
  "plugins": {
    "admin-dashboard": {
      "github": {
        "repo": "owner/repo"
      },
      "defaultRangeWeeks": 12
    }
  }
}
```

The repo can also be set via the UI; it is stored in localStorage under
`admin-dashboard:github-repo`.
