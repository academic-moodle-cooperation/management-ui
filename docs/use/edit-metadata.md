# Edit metadata

For editors maintaining recording details. Afterwards you'll have changed a video's metadata and saved it.

![The Videoinfo panel in edit mode: a pencil beside each editable field, the "* required" legend and Save below.](/screenshots/episode-details-edit-light.png)

## Change a field

1. On **Videos**, click the row. The **Videoinfo** panel opens on the right.
2. Click **Edit** at the bottom. A pencil now sits beside every field you may change.
3. Click a pencil — or the field itself — and type or pick the new value. Only one field is open at a time; opening the next one keeps what you just entered.
4. Click **Save**.

**Save stays greyed out until you actually change something.** That is the quickest way to tell whether your edit registered.

A green **Changes have been saved!** confirms the save and the panel closes. [What each field means](./field-reference.md).

## Required fields

A field whose label ends in `*` must not be empty; **\* required** under the fields is the legend. Clear one and save, and you get **Required field is empty** — nothing is written, the panel stays open, and you can put the value back.

## If the save fails

**Changes failed to save!** in red means the recording was not changed. **The panel stays open and your edit survives**, so you can just click *Save* again. You never have to retype anything.

## What you cannot change here

- **Read-only fields have no pencil.** Which ones those are is your organization's decision, made in Opencast per field; the panel only offers what the server will accept. [The field reference](./field-reference.md) lists the usual defaults.
- **A recording being processed cannot be edited.** Instead of *Edit*, the panel reads **This video cannot be edited at the moment.** Wait for the status to change — [the status reference](./status-reference.md) says exactly which statuses block editing.
- **Permissions.** Who may see a recording is not editable in the standard interface. If your deployment shows an **Access** column, a globe there means *Public access* and a lock *Restricted access*, but there is no editor behind either icon. Changing access needs a plugin your organization installs, or the Opencast admin interface.

## Careful with Cancel

**Cancel** does not just leave edit mode — it closes the panel and discards every unsaved change. Clicking anywhere outside the panel and the table does the same, without asking. Save before you click away.
