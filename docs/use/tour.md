# The interface in five minutes

For anyone opening Management UI for the first time. Afterwards you'll recognize every part of the screen and know where your work happens.

![The Videos screen: navigation on the left, the table toolbar above the list, paging controls below it.](/screenshots/episodes-list-light.png)

## The left navigation is the whole map

- **Home** — a page about the software itself. It is a project landing page, not a work dashboard: no counts, no recent items, nothing to continue from.
- **Series** — the groups your recordings belong to.
- **Videos** — every recording you may work with. Most tasks start here.
- **Upload** — add new files.
- **Marketplace** — administrators only, and it manages plugins, not content.

**So start at Videos or Series**, not at Home. Collapse the navigation with the panel button beside it, or press <kbd>Ctrl</kbd>/<kbd>Cmd</kbd> + <kbd>B</kbd>.

## The header

Three controls, top right:

- The sun/moon button sets the **appearance**: Light, Dark, or System.
- The language name — **English** or **Deutsch** — switches the interface language. Those two ship.
- **Logout** ends your session. Signed out, the same button reads **Login**.

## One toolbar for every table

Videos and Series share it:

- **Search…** filters the list.
- **Reset** appears beside the search box while a search is active and clears it.
- **View** shows and hides columns.
- **Reload Data** fetches the list again.
- Under the table: **Rows per page** and the page arrows.

The Videos screen adds a grid button left of *View* that swaps the list for a gallery of thumbnails — if your deployment enabled it. [Find a video](./find-a-video.md) covers all of this in detail.

## The panel pattern

Everything you edit works the same way, on Videos and on Series alike:

1. **Click a row.** A panel opens on the right — **Videoinfo** for a recording, **Series Info** for a series.
2. **Click Edit** at the bottom of the panel. A pencil appears next to every field you may change.
3. **Click a pencil**, change the value, then **Save**.

**Cancel** does not merely leave edit mode — it closes the panel and drops your change. [Edit metadata](./edit-metadata.md) walks through it field by field.
