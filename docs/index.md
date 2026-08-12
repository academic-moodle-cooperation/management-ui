---
layout: home

hero:
  name: Management UI
  text: A plugin-first admin interface for Opencast.
  tagline: A thin shell hosts routing, auth, and layout. Every visible feature ships as a plugin — with a frozen contract.
  actions:
    - theme: brand
      text: Deploy it
      link: /getting-started/deployment
    - theme: alt
      text: Build a plugin
      link: /plugins/first-plugin
    - theme: alt
      text: Contribute
      link: https://github.com/academic-moodle-cooperation/management-ui/blob/HEAD/CONTRIBUTING.md

features:
  - title: Deploy it
    details: For Opencast admins. Afterwards you'll have Management UI running on your Opencast — three JARs deployed, one config.json in place, login working.
    link: /getting-started/deployment
    linkText: Deployment
  - title: Build a plugin
    details: For plugin developers. Afterwards you'll have a working plugin scaffolded, visible in the dev shell, with its contract test green — in about five minutes.
    link: /plugins/first-plugin
    linkText: Your first plugin
  - title: Contribute
    details: For contributors to this repo. Afterwards you'll know the dev loop, the changeset rule, and what CI will demand — everything to land your first PR.
    link: https://github.com/academic-moodle-cooperation/management-ui/blob/HEAD/CONTRIBUTING.md
    linkText: CONTRIBUTING.md
---

## What to read next

- **[Deploy it](/getting-started/deployment)** — run Management UI on your Opencast.
- **[Build a plugin](/plugins/first-plugin)** — extend the UI without forking it.
- **[Contribute](https://github.com/academic-moodle-cooperation/management-ui/blob/HEAD/CONTRIBUTING.md)** — work on the shell, the shared packages, or the built-in plugins.

New here? [What is Management UI?](/getting-started/what-is-management-ui) is the one-screen tour. The frozen plugin contracts live in [Contracts](/architecture/CONTRACTS); AI agents start at [`AGENTS.md`](https://github.com/academic-moodle-cooperation/management-ui/blob/HEAD/AGENTS.md) and [`llms.txt`](https://github.com/academic-moodle-cooperation/management-ui/blob/HEAD/llms.txt).
