---
"@oc-mui/plugin-core-upload-v2": minor
"@oc-mui/plugins": minor
---

Add the upload v2 plugin: background ingest, honest cancellation, and metadata editing before upload.

The new `upload-v2` plugin registers its own `/upload-v2` route and sidebar entry
and runs alongside the existing `upload` plugin, so both can be enabled during
the test phase. Enable it per installation via `app.enabledPlugins`.

What phase 1 puts in place:

- **Files transfer while the user is still working.** A media package is created
  and the track streamed as soon as a file is dropped ("preparing"); title,
  language, processing options and ACL are applied just before `/ingest/ingest`,
  which is the only irreversible call.
- **Cancelling really removes the data.** Discarding aborts the transfer and
  calls `discardMediaPackage`, with a `beforeunload` beacon and a `localStorage`
  record so a closed tab does not silently leave bytes on the server.
- **Large files no longer exhaust browser memory.** The `File` is handed to the
  transport untouched instead of being rebuilt from chunks in the JS heap, which
  is what made multi-gigabyte uploads fail in v1.
- **Transport sits behind an adapter** exposing `resumable` / `pausable`
  capabilities, so a resumable backend can be added later without touching the
  UI. The shipped transport posts to `/ingest/addTrack` and cannot resume.
- **A two-pane work surface**: a dense queue on the left, an inspector on the
  right that edits whatever is selected. Progress fills each row's own
  background and a status rail colours its left edge, so scanning a long queue
  is a colour scan rather than a text scan. The primary action says "Publish",
  never "Upload".
- **Metadata and processing options before upload** (issue #123): spoken
  language, subtitle generation and translation, publish-now versus
  prepare-for-the-editor, and a custom preview image. Selecting several files
  edits them together and any field whose values disagree shows as "mixed", so
  there is no separate global gear and no overwrite warning to confirm — the
  conflict is visible before the edit instead of confessed after it. Translation
  switches itself off when the spoken language is already English.
- **The recording date is no longer the upload date.** `dcterms:created` was
  written as "now", silently misdating every episode that wasn't recorded the
  day it was uploaded. It now defaults to the file's own modification time and
  is editable.
- **Presenters are no longer forced to the uploading user.** `dcterms:creator`
  took the uploader's name, which is wrong whenever someone uploads on another
  person's behalf. It is now an editable list, one catalog element per name,
  falling back to the uploader only when left empty.
- Optional Dublin Core fields — description, subject, license, rights holder,
  contributors — can be switched on per installation via
  `plugins["upload-v2"].visibleFields`. Empty by default.
- **Dual stream**, via two entry paths onto the same model: add the missing
  speaker or screen track to any item from the inspector — including while it
  is still transferring, or after it already finished, in which case the new
  track joins the *same* media package rather than starting a second one — or
  switch to dual-stream mode and fill two labelled slots to add a pair at once.
  Batch pairing of many files is not covered.
- **Access rights on upload, which the OSS build never had.** v1 rendered the
  `upload:acl-editor` extension point with `null` as its default, so without an
  organisation-specific plugin there was no way to set permissions. v2 keeps
  the same slot and the same prop names — existing org plugins keep working —
  but defaults to the shared `AclEditor`, opened from a dialog. Setting no
  rights attaches no policy at all, leaving Opencast's series/workflow default
  in place rather than writing an empty one that would deny everyone.
- **Workflows and their options are discovered, not configured.** Upload v2 asks
  Opencast which workflows it offers for uploads
  (`GET /api/workflow-definitions?filter=tag:upload&withconfigurationpaneljson=true`)
  and renders each one's declared options generically. A field's declared
  `name` is exactly the property key posted to `/ingest/ingest`, so options like
  subtitle generation work without anyone writing the key into `config.json` —
  and a workflow that gains an option gets a working control for free. Falls
  back to the configured `plugins["upload-v2"].workflows` / `.stt` when the
  External API cannot be reached, so nothing breaks where it is closed off.

Everything is styled through semantic theme tokens and `@oc-mui/ui` components
only, so an org theme plugin restyles the screen without touching it.

Verified against the Opencast 19 and 20 ingest APIs, whose REST surface is
identical, so no version gating is needed.
