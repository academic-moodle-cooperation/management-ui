# Plugin Development — Documentation Index

This index points plugin developers to the right docs for building, testing, and deploying plugins for the Management UI.

## Start here

- **[Community Plugin Development](COMMUNITY_PLUGIN_DEVELOPMENT.md)** — Main guide: architecture, template, build, local testing, JAR deployment, registry, and Marketplace usage. Read this first.
- **[Community Plugin Available Packages](COMMUNITY_PLUGIN_AVAILABLE_PACKAGES.md)** — Which packages you can import in your plugin (react, @workspace/*). Required before coding.

## Build and deploy

- **[JAR Plugin Deployment Summary](JAR_PLUGIN_DEPLOYMENT_SUMMARY.md)** — How to package a plugin as a JAR and deploy it to Opencast (production).
- **[Plugin Loading Mechanisms](PLUGIN_LOADING_MECHANISMS.md)** — How plugins are loaded (built-in, remote, JAR, Marketplace). Useful for understanding the system.
- **[Community Plugins Next Steps](COMMUNITY_PLUGINS_NEXT_STEPS.md)** — Registry setup, local registry for testing, and optional enhancements.

## Reference

- **[Plugin Structure](PLUGIN_STRUCTURE.md)** — Recommended plugin layout.
- **[Community Plugin Dependency Management](COMMUNITY_PLUGIN_DEPENDENCY_MANAGEMENT.md)** — How to manage dependencies and avoid bundling host-provided packages.
- **[Registry Repository README](REGISTRY_REPOSITORY_README.md)** — Registry format and how to run a community or private registry.
- **`registry-repo-contents/`** — Template and validation for a registry repository (e.g. GitHub).

## Monorepo contributors

- **[Adding Plugins](workflows/ADDING_PLUGINS.md)** — How to add a new plugin inside the monorepo.
- **`pnpm plugin:export-local <plugin-name> --move`** — Official helper command to move a prototype from `plugins/` to `.local-plugins/`.
- **`pnpm plugin:export-local <plugin-name> --move --convert-community --wire-config`** — One-shot export + community conversion + namespace wiring.
- **`pnpm plugin:create-local <plugin-name> --wire-config`** — Generate a new local community-style plugin from template.

## Optional / deep dives

- **[Plugin Development Workflow](PLUGIN_DEVELOPMENT_WORKFLOW.md)** — Step-by-step workflow using the Statistics Dashboard example.
- **[Plugin GraphQL Extensions](PLUGIN_GRAPHQL_EXTENSIONS.md)** — Extending GraphQL with fragments.

Example-specific or historical docs (quiz plugin, stats dashboard, implementation plan, database strategies) are in [plugin-examples/](plugin-examples/) if you need them.
