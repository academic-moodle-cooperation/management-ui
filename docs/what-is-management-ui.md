# What is Management UI?

For anyone meeting the project for the first time. Afterwards you'll know what Management UI is, whether it fits your case, and which entry to read next.

Management UI is a modular admin interface for [Opencast](https://opencast.org), the open-source academic video platform. A thin shell hosts routing, auth, and layout; every visible feature — the video and series tables, upload, the admin screens — ships as a **plugin**. Organizations customize the UI by adding, removing, and configuring plugins, never by forking core code. It installs on a stock Opencast as additional OSGi bundles, and the standard Opencast admin interface stays untouched beside it.

## The one idea: everything is a plugin

The shell knows nothing about any specific feature. At boot it loads plugins and asks them what routes they own, what sidebar entries to render, and what config defaults they contribute — then renders accordingly. Plugins register on **extension points**; the shell wires them in.

What that buys each audience:

- **Admins** turn features on and off per deployment with one config file — no build step, no restart.
- **Plugin authors** add routes, sidebar entries, themes, and config against frozen public contracts. The host commits to contract stability; plugins commit to staying inside the contracts.
- **Contributors** get a shell that stays small: features land as plugins, and the extension points the built-in plugins use are exactly the ones org plugins use. There is no privileged internal API to drift away from.

In-tree plugins ship with the repo; organization plugins live in their own repositories and deploy as JARs dropped next to the host bundles.

## Does it fit your case?

It fits if you run Opencast and want a task-focused interface your organization can shape without maintaining a fork. It does not replace Opencast: there is no standalone or demo mode, and every screen reads and writes through a live Opencast.

## Pick your entry

| You want to… | Start at |
|---|---|
| See it running in five minutes | [Quickstart](./quickstart.md) |
| Work with recordings in the interface | [Use it](./use/index.md) |
| Deploy and configure it on your Opencast | [Run it](./operate/index.md) |
| Add your own screens or backend fields | [Extend it](./extend/index.md) |
| Work on the shell, packages, or built-in plugins | [Contribute](./contribute/index.md) |
