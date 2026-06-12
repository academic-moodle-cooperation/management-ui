---
layout: home

hero:
  name: Management UI
  text: A plugin-first admin interface for Opencast.
  tagline: A thin shell hosts routing, auth, and layout. Every visible feature ships as a plugin — with a frozen contract.
  actions:
    - theme: brand
      text: Get started
      link: /getting-started/what-is-management-ui
    - theme: alt
      text: Write a plugin
      link: /plugins/creating-a-plugin
    - theme: alt
      text: View on GitHub
      link: https://github.com/academic-moodle-cooperation/management-tool

features:
  - title: Plugin-first architecture
    details: Routes, sidebar entries, themes, and config all come from plugins. The shell never has to know about your feature.
  - title: Frozen contracts
    details: Manifest 1.1, Runtime API 1.0, Theme 2.0, Config 1.0 — stable for the 1.x line, mechanically verified by API Extractor and a contract-test harness.
  - title: Four distribution paths
    details: Ship plugins in-tree, mount them at dev time from .local-plugins/, deploy them as JARs alongside Opencast, or publish them to a CDN.
  - title: Semantic theming
    details: CSS-variable tokens, org themes override values without touching components. Plugins consume `bg-card`, `text-muted-foreground`, …
  - title: Loose coupling
    details: pnpm workspace with strict architectural boundaries enforced by eslint-plugin-boundaries. Lower layers never depend on higher ones.
  - title: AI-friendly
    details: Every doc is also legible to an LLM. `llms.txt` ships a machine-readable summary; `AGENTS.md` documents the operational rules.
---

## What to read next

Use the top navigation to find your audience:

- **[Getting started](/getting-started/what-is-management-ui)** — what it is, how to install it, how to configure it.
- **[Plugins](/plugins/creating-a-plugin)** — the walkthrough, distribution paths, styling and i18n contracts.
- **[Architecture](/architecture/overview)** — three pillars, dependency layers, contracts, ADRs.
- **[Operations](/operations/release)** — releases, CI, the test pyramid.

Contributing? Read [`CONTRIBUTING.md`](https://github.com/academic-moodle-cooperation/management-tool/blob/HEAD/CONTRIBUTING.md) and [`AGENTS.md`](https://github.com/academic-moodle-cooperation/management-tool/blob/HEAD/AGENTS.md) on GitHub.
