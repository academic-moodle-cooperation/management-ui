# Status reference

For everyone wondering why an action is unavailable. Afterwards you'll know what each processing status means and what it blocks.

Every recording carries exactly one status. It appears as an icon in the **Status** column of [the video list](./find-a-video.md) — hover it to read the label. In gallery view the same symbol sits on the thumbnail of anything that is not finished.

## The nine values

| Status | What it means | Metadata editable? |
|---|---|---|
| **Scheduled** | A recording is planned but has not started. | yes |
| **Recording** | A capture device is recording right now. | yes |
| **Ingesting** | The file is being transferred into Opencast. | yes |
| **Processing pending** | Queued for processing; nothing is running yet. | **no** |
| **Processing** | A workflow is running — transcoding, publishing, and so on. | **no** |
| **Processing paused** | A workflow is waiting, often for someone to act in Opencast. | yes |
| **Processing cancelled** | Someone stopped the workflow before it finished. | yes |
| **Processing failure** | The workflow ended in an error. | **no** |
| **Processed** | Everything finished. The normal state of a usable recording. | yes |

## What a status blocks

### Metadata editing — three statuses

Editing is blocked in exactly **Processing pending**, **Processing**, and **Processing failure**. In those, the *Edit Data* action is missing from the row, and the panel shows **This video cannot be edited at the moment.** where the *Edit* button normally sits. In every other status — including *Scheduled* and *Recording* — [editing metadata](./edit-metadata.md) works normally.

### Permissions — one status

Where a permission editor is available at all — it is not part of the standard interface, see [Edit metadata](./edit-metadata.md) — it accepts **only Processed**.

The two rules genuinely differ, and the difference catches people out: **a *Scheduled* recording is metadata-editable but permission-locked.** These are not two views of the same rule.

### Deleting — never

Both [the trash and permanent deletion](./delete-a-video.md) are offered in every status.

### Playing, downloading, and the video editor — not about status at all

These depend on what exists for the recording, not on where it is in the pipeline:

- **Play Video** and **Download** appear only once the recording has a published version.
- **Edit Video**, which opens Opencast's own video editor in a new tab, needs a preview version to exist.
- **Download** may also appear greyed out when the recording has a published version but nothing that can be handed over as a file — live-stream-only publications, for instance.

## Automatic refreshing

While any recording on screen is processing, the list refreshes itself roughly every 20 seconds and an open panel about every 10. You do not have to press **Reload Data** to watch something finish.
