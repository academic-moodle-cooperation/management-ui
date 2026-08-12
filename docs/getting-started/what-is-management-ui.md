# What is Management UI?

For anyone meeting the project for the first time — admin, plugin author, or contributor. Afterwards you'll know what Management UI is, whether it fits your case, and which page to read next.

Management UI is a modular admin interface for [Opencast](https://opencast.org), the open-source academic video platform. A thin shell hosts routing, auth, and layout; every visible feature — the episode and series tables, upload, the admin screens — ships as a **plugin**. Organizations customize the UI by adding, removing, and configuring plugins, never by forking core code. It installs on a stock Opencast as additional OSGi bundles; the standard Opencast admin interface stays untouched beside it.

## Pick your path

| You are… | Afterwards you'll have… | Start here |
|---|---|---|
| **An Opencast admin** | Management UI running on your Opencast: three JARs deployed, one `config.json` in place, login working | [Deployment](./deployment.md) |
| **A plugin developer** | A working plugin scaffolded, visible in the dev shell, contract test green — in about five minutes | [Your first plugin](../plugins/first-plugin.md) |
| **A contributor** | The dev loop, the changeset rule, and what CI will demand — everything to land your first PR | [CONTRIBUTING.md](../../CONTRIBUTING.md) |

## The one idea: everything is a plugin

The shell is unaware of any specific feature. At boot it loads plugins and asks them what routes they own, what sidebar items to render, what config defaults they contribute — and renders accordingly. Plugins register on **extension points** (`apps:definitions`, `sidebar:nav-items`, `app:header-logo`, `app:config:defaults`, …); the shell wires them in.

What that buys each audience:

- **Admins** turn features on and off per deployment with one config file — no build step, no restart ([Configuration](./configuration.md)).
- **Plugin authors** add routes, sidebar entries, themes, and config against **frozen public contracts** — plugin manifest, runtime API, theme, config, and more, versioned in [Contracts](../architecture/CONTRACTS.md). The host commits to contract stability; plugins commit to staying inside the contracts.
- **Contributors** get a shell that stays small: features land as plugins, and the same extension points the built-in plugins use are the ones org plugins use — there is no privileged internal API to drift away from.

## How plugins reach a deployment

In-tree plugins ship with the repo; org plugins live in their own repositories (mounted under `.local-plugins/` at dev time) and deploy to production as JARs dropped next to the host bundles; marketplace plugins install at runtime. The four delivery paths are compared in [Distribution](../plugins/distribution.md).

## Where things are

The repo layout is in the [README](../../README.md#repo-layout); the package layers and the plugin model are in the [architecture overview](../architecture/overview.md). Running the UI from a source checkout is [Run from source](./installation.md); the full contributor stack including a local Opencast is [Full local setup](./local-backend.md).
