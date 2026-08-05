# @oc-mui/plugin-core-upload-v2

The next-generation upload screen. Registers `/upload-v2`, its sidebar entry and
its config defaults, and runs beside `core-upload` until v1 is retired.

## Why a second plugin

Three things could not be retrofitted onto v1:

- **Memory.** v1 rebuilt every file from an array of chunks (`getMediaBlob`), so
  a 10 GB upload needed 10 GB of JS heap. v2 hands the `File` to the transport
  untouched and the browser streams it from disk.
- **Interruptibility.** v1's upload was one long `async` function. Pause,
  resume, cancel-with-cleanup and background transfer need a state machine.
- **Ownership.** v1 keeps its state in `@oc-mui/store`, a shared package. v2
  owns its queue.

## How the lifecycle works

```
queued ──► preparing ──► prepared ──► submitting ──► done
              │             │             │
              └─────── discarded ◄────────┘
```

The design rests on one property of Opencast's ingest API: a track can be
attached to a media package at any time, but the workflow only starts at
`/ingest/ingest`. So bytes move immediately while metadata is collected at
leisure, and everything before that final call is reversible through
`discardMediaPackage`.

The user-facing word for `preparing` is deliberately *not* "uploading" — nobody
should read "upload" before they pressed anything. The final button says
"publish", not "upload".

## Layout

| Path | What lives there |
|---|---|
| `src/model/queue.ts` | The queue and the lifecycle. Module-level, so transfers survive navigation |
| `src/model/orphans.ts` | `localStorage` + `beforeunload` protection against abandoned media packages |
| `src/ingest/client.ts` | Thin wrapper over `/ingest/*` |
| `src/transport/` | Swappable transport; `ingestXhr` today, a resumable one later |

## Opencast compatibility

The ingest REST surface is identical in Opencast 19 and 20 —
`IngestRestService.java` is the same file on both release branches — so nothing
here is version-gated.

## Config

See `src/config.ts`. Two groups are deliberately configurable rather than
hardcoded: the workflow IDs for "publish" versus "prepare for the editor", and
the workflow property names used for speech-to-text. Opencast forwards every
extra form field of `/ingest/ingest` into the workflow as a configuration
property, but *which* names a workflow reads is a property of that workflow, not
of Opencast.

## Development

```bash
pnpm --filter @oc-mui/plugin-core-upload-v2 test
pnpm --filter @oc-mui/plugin-core-upload-v2 test:contract
```

## The inspector, and why there is no gear icon

Issue #123 sketched a settings gear per upload plus a global one, with a warning
when "apply to all" would overwrite individually edited items. This ships the
capability without the mechanism: the right-hand inspector edits *the current
selection*, so editing one file and editing all of them is the same gesture,
and a field whose values disagree across the selection renders as **mixed**.
The conflict is visible before the edit rather than confessed after it, which
is what the warning dialog was for.

Consequently the queue keeps no `overridden` bookkeeping — `updateMany` is the
only settings write path.

Three groups of behaviour are configuration rather than constants, because they
differ per installation: `workflows.publish` / `workflows.prepare`, the
`stt.*Key` property names, and `visibleFields`. Opencast forwards every extra
form field of `/ingest/ingest` into the workflow as a configuration property,
but *which* names a workflow reads belongs to that workflow. Controls whose key
is unset stay hidden, so an installation without a prepare workflow simply
never offers the option.

`visibleFields` switches on the institution-specific Dublin Core fields
(`description`, `subject`, `license`, `rightsHolder`, `contributors`). Empty by
default — an unused field is worse than a missing one. Title, recording date,
presenters, language and processing are always shown.

## Workflows: ask Opencast, don't configure it

`src/ingest/workflows.ts` fetches
`/api/workflow-definitions?filter=tag:upload&withconfigurationpaneljson=true`.
Every definition tagged `upload` comes back with its title, description,
display order and a structured declaration of its own options. A declared
field's `name` **is** the workflow property key: any extra form field posted to
`/ingest/ingest` reaches the workflow under that name, because Opencast's
`getWorkflowConfig` copies all of them except `mediaPackage`.

So the inspector renders the workflow's own controls instead of hardcoded ones.
Subtitle generation works because the workflow says it takes a `transcription`
option — nobody has to look that name up and write it into `config.json`, and a
workflow that gains an option gets a working control without touching this
plugin. Declared defaults (`value`) are seeded when a workflow is chosen.

The `workflows.*` and `stt.*` config keys remain as the fallback for
installations whose External API is not reachable; discovery returning an empty
list is not an error, it just means the fixed publish/prepare pair is used.

Both the endpoint and `withconfigurationpaneljson` exist in Opencast 19 and 20.

## Metadata, and the field set we cannot ask for

Ideally the inspector would render whatever Opencast says an episode has.
Opencast *does* describe its catalog — `MuiGetEventByIdInputFields` returns each
field's label, type, required flag, order and allowed values, which is how the
episode detail view renders without hardcoding anything. That query needs an
**event id**, and during upload no event exists yet: it is created by
`/ingest/ingest`, at the very end. So the field list here is hand-written
against `CommonEventMetadataInput`, and the licence control is free text rather
than a picker because the allowed values live in that unreachable definition.

If the backend ever serves the episode catalog definition without an instance,
this whole section can be replaced by the same `MetadataField` rendering the
episode view uses.

Two fields are deliberately not offered: `duration` is derived from the media,
and `identifier` is the media package id.

## Dual stream

A recording is one item with one or two tracks, so both entry paths produce the
same shape and nothing below the UI has to branch:

- **Per item** — the inspector's track list offers "add speaker/screen track"
  for whichever flavor is missing. Works right up until submit, *including
  while the first track is still transferring* and after the item already
  reached `prepared`.
- **Dual-stream mode** — two labelled slots. Filling both creates one item and
  clears the slots, ready for the next pair.

Two things in `prepare()` make the per-item path safe: the media package is only
created when the item doesn't already have one (a second track must join the
same package, not a new one), and the upload loop re-reads the pending track
from state on every pass instead of iterating a snapshot — otherwise a track
added mid-transfer would be silently skipped.

A track's flavor is frozen once it is attached, because the flavor travels with
the bytes in `addTrack`; the UI stops offering the swap rather than failing at
submit time. Same for removal.

Pairing a batch — twenty files that should become ten dual-stream recordings —
is deliberately **not** covered. Filename-based pairing could be added later on
top of the same model without changing it.

## Access rights

Rendered through the **same `upload:acl-editor` extension point v1 used, with
the same prop names**, so an organisation's existing ACL plugin keeps working
in v2 unchanged. What changed is the default: v1 resolved the slot to `null`,
so the OSS build could not set permissions on upload at all. v2 defaults to the
shared `AclEditor` from `@oc-mui/ui`, opened from a dialog.

A dialog rather than an inline field because that component renders a
four-column table of people against permissions, which is unusable in a 300px
panel. The inspector shows a summary and a button.

Setting no rights attaches **no** policy, so Opencast falls back to the series
or workflow default. An empty XACML policy is not "unrestricted", it is "nobody
may do anything" — `buildAccessPolicy` returns `undefined` for an empty rule
set precisely so we never lock an episode away from its own uploader.

The `AclEditor` itself was fixed while wiring this up: it used to render bare
translation keys on first open, and it used to demand three props that only
make sense when editing an existing entity. See the `@oc-mui/ui` changeset.
`showUpdateButton={false}` is still passed here, because the default is `true`
and an upload has nothing to update.

## Not yet implemented

The resumable transport and its backend bundle — tracked as issue #263. The
adapter and its `capabilities` flag are in place, so adding it changes no
component; it needs a disk budget and a reaper interval from Operations first.
Failed items offer no retry — remove and re-add. Language defaults are labelled
"from series" and left unset rather than pre-filled from the series metadata.
The dev default config ships with `upload-v2` in `enabledPlugins`; deployments
control visibility through their own mounted config.
