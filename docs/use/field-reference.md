# Field reference

For everyone filling in a form. Afterwards you'll know what every video and series field holds.

Two things vary by deployment, so treat the "read-only" columns below as the shipped defaults rather than a promise:

- Your organization decides in Opencast which fields exist and which of them may be written. A field the server refuses is shown without a pencil, whatever this page says.
- Your deployment can hide fields and columns it does not use, so your panel may be shorter than these tables.

## Video fields

These are the fields in the **Videoinfo** panel. A field marked required in your Opencast shows a `*` after its label and cannot be saved empty.

| Field | What it holds | Read-only by default |
|---|---|---|
| **Title** | The recording's name. Set from the file name at upload; usually the first thing worth correcting. | no |
| **Series** | The series the recording belongs to. Changing it moves the recording. | no |
| **Description** | Free text about the content. | no |
| **Presenter** | Who appears in or gave the recording. | **yes** |
| **Contributor** | Everyone else involved. | no |
| **Creator** | Who published the recording. Note it is *not* the person who uploaded it, despite the label. | **yes** |
| **Date** | When the recording took place. This is what the **Date** column sorts by. | no |
| **Created** | When the entry was made in Opencast. Not the same as *Date*. | **yes** |
| **Duration** | How long the recording runs. | no |
| **Origin** | Where it was recorded — the room, the capture agent, or `Upload` for a file you uploaded yourself. | no |
| **Language** | Spoken language, picked from a list. | no |
| **License** | The licence it is published under, picked from a list. | no |
| **Rightsholder** | Who holds the rights. | no |
| **Subject** | Topic or keywords. | no |
| **Source** | Where the material came from. | no |
| **Video ID** | Opencast's identifier for the recording. Click it to copy — **Video ID copied** confirms. Quote it in support requests. | **yes** |

### Video columns

The table on **Videos** draws on the same data: **Title**, **Series**, **Description**, **Contributors**, **Status**, **Duration**, **Origin**, **Presenter**, **Date**, and **Actions**. Two of them are not simply a field:

- **Status** is an icon, not text — see [the status reference](./status-reference.md).
- **Access**, if your deployment shows it, is an icon too: a globe for *Public access*, a lock for *Restricted access*. It is display-only; nothing behind it can be edited here.

`Duration` shows `∞` when the recording has no usable duration — typically something still being ingested.

## Series fields

These are the fields in the **Series Info** panel, and the same set appears in the **Create new series** dialog.

| Field | What it holds | Read-only by default |
|---|---|---|
| **Title** | The series name. Required — a series cannot be created without one. | no |
| **Description** | Free text about the series. | no |
| **Organizer** | Who runs the series. Shown as **Creator** in the series table — same value, two labels. | **yes** |
| **Contributors** | Everyone else involved. Several entries, separated by commas or new lines. | no |
| **Publisher** | Who publishes the series. Several entries allowed. | no |
| **Language** | The series' language, picked from a list. | no |
| **License** | The licence, picked from a list. | no |
| **Rightsholder** | Who holds the rights. | no |
| **Subject** | Topic or keywords. | no |
| **Series ID** | Opencast's identifier for the series. Click it to copy — **Series ID copied** confirms. | **yes** |

### Series columns

The table on **Series** shows **Series** (the title), **Created**, **Description**, **Creator**, **Contributors**, **Videos**, and **Actions**. **Videos** is the number of recordings in the series and a link to them; a dash means none. See [Work with series](./series.md).

## Dates

Dates are shown in day-month-year order with a 24-hour clock (`05.02.2026, 09:00`) on both tables, regardless of the interface language you picked.
