# Upload a video

For everyone adding new material. Afterwards you'll have uploaded a file and know what the system does with it next.

![The Upload screen: a dashed drop zone reading "Click to upload or drag and drop", with a Select Files button below it.](/screenshots/upload-light.png)

## Add the files

Open **Upload**. Drag files onto the dashed box, click the box, or use **Select Files**. Several files at once are fine, and the interface imposes no size limit.

Only **audio and video files** are accepted. Dropping anything else opens **Invalid File Format** — *"The file format is not supported. Please upload only audio and video files."* — and rejects the whole drop, not just the offending file. Files chosen through the *Select Files* dialog are not checked at this point; a wrong format there fails later, during the upload itself.

## Check the list

Each file appears under **Uploadlist** with its name (the extension stripped) and its size.

- The **pencil** beside a name renames it. **That name becomes the video's title** — it is your only chance to set one.
- The **×** takes a file back out of the list, or stops an upload already running.
- **Delete list** clears everything, including the *Recently uploaded* entries below it.

## Pick the series, then upload

The **Series** selector appears once at least one file is in the list. Choose one — **Upload stays disabled until you do** — then click **Upload**.

## What actually gets sent

Very little, and that is the point:

- the **title**, taken from the file name shown in the list,
- the **series** you picked,
- **you**, as the creator, and
- the file itself.

**There is no metadata form and no workflow picker in the standard interface.** Description, language, date, rights, and how the recording is processed are not asked here. Everything else you add afterwards, on [the video's panel](./edit-metadata.md).

## While it runs

Files go up one after another, each with a percentage and a progress bar. **File successfully uploaded** confirms a file, **File upload failed** means it did not arrive, and **File upload aborted** appears when you stopped it yourself.

Your Opencast then has to process the recording before it is usable. That can take a long while, and this interface will not notify you — check the **Status** column on [Videos](./find-a-video.md) instead, and see [the status reference](./status-reference.md).

Finished files move into **Recently uploaded**, a collapsed section above the list. It survives a page reload but not a new tab, and *Delete list* clears it too.

## If there is no series

Upload needs one. With no series at all, the page shows only **No series available** — [create one first](./series.md).
