# Documentation

The table of contents lives in exactly one place: the VitePress sidebar in [`.vitepress/config.mts`](./.vitepress/config.mts). The rendered site publishes to <https://academic-moodle-cooperation.github.io/management-ui/> (deploys are currently dormant — see [`.github/workflows/docs.yml`](../.github/workflows/docs.yml)).

Three entry points, by audience:

- **Deploy it on your Opencast** → [`getting-started/deployment.md`](./getting-started/deployment.md)
- **Build a plugin** → [`plugins/first-plugin.md`](./plugins/first-plugin.md)
- **Contribute to this repo** → [`CONTRIBUTING.md`](../CONTRIBUTING.md)

Pages listed in the config's `srcExclude` (e.g. [`operations/open-followups.md`](./operations/open-followups.md)) are internal: readable here on GitHub, never built into the site.
