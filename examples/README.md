# examples/

This folder holds reference material that is **not** part of the shipped
application. Its contents exist only as copy-paste starting points for
external contributors and for AI agents that are scaffolding new plugins.

The two key rules for everything under `examples/`:

1. **Not a workspace package.** `pnpm-workspace.yaml` does **not** glob
   `examples/*`. Nothing in here is installed, linked, linted or built as
   part of the monorepo. This guarantees the content cannot accidentally
   be depended on by a core package.
2. **Temporary home.** Everything here is scheduled to be moved out of
   this repository before the 1.0 open-source release. See
   `community-plugin-template/EXTRACT_ME.md` for the extraction plan.

## Inventory

| Path                                 | Status                                   | Target location                                  |
| ------------------------------------ | ---------------------------------------- | ------------------------------------------------ |
| `community-plugin-template/`         | To be extracted into a dedicated starter | Separate `management-ui-community-plugin-template` GitHub repository |

If you add a new example, also add an `EXTRACT_ME.md` inside it that
documents where it will eventually live.
