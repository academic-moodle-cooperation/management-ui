# Work with series

For everyone grouping recordings. Afterwards you'll have created a series, edited it, and found the videos that belong to it.

A series is the container a recording lives in — a course, a lecture series, a project. Every upload needs one.

![The Series screen: the Create series button beside the heading and a Videos count in each row.](/screenshots/series-list-light.png)

## Browse

**Series** in the left navigation lists them with **Created**, **Description**, **Creator**, **Contributors**, and a **Videos** count. The first column is headed **Series**, not "Title". Search, sorting, columns, and paging behave exactly as on [Videos](./find-a-video.md).

The number under **Videos** is a link: it opens the video list limited to that series. A dash means the series has none yet.

## Create a series

1. Click **Create series** next to the **Series** heading. The same button is offered when your list is still empty.
2. **Create new series** opens. If your deployment offers several kinds of series, **New series** first asks which kind you want; pick one, and **Back** returns to that choice.
3. In the standard form, fill in **Title** — the only required field, marked with `*`.
4. Optionally add Description, Language, License, Contributors, Organizer, Publisher, Subject, and Rightsholder. The multi-value boxes take several entries, separated by commas or new lines.
5. Click **Create**. **Series created** confirms it; **Failed to create series** means nothing was saved.

Which optional fields appear depends on what your Opencast accepts, so your dialog may be shorter than the list above.

## Edit a series

Click a row to open **Series Info**, then **Edit**, then the pencil beside a field, then **Save** — the [same pattern as for a video](./edit-metadata.md), with the same rules: Save stays greyed out until something changes, a failed save keeps your edit, and Cancel discards it. The pencil in a row's **Actions** column opens the panel already in edit mode.

**Series ID** and **Organizer** are read-only by default; [the field reference](./field-reference.md) lists them all.

## Upload into a series

The cloud icon in a row's **Actions** column opens [the upload page](./upload.md) with that series already chosen.

## Series cannot be deleted

There is no delete action for a series anywhere in this interface — not in the row actions, not in the panel, not behind a menu. Removing one has to happen in the Opencast admin interface or through its API. An empty series does no harm, so leaving it in place is usually the right answer.
