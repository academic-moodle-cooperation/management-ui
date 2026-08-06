---
"@oc-mui/query": minor
"@oc-mui/plugin-core-episodes": minor
"@oc-mui/i18n": patch
---

Videos view: soft-delete by default, admin-only permanent delete.

The delete action in the Videos table now performs a **soft delete** — it calls the
custom `mui.deleteEvent` mutation, which the backend routes through the configured
trash workflow (move-to-trash series), hiding the event from regular users while
keeping it recoverable. This is the intended recycle-bin behaviour, and it is what
the release protocol's delete step actually asks for ("wird das Video in der
Admin-ui in die Papierkorbserie gelegt. Für den User sieht es so aus, als wäre es
wirklich gelöscht").

A second, **admin-only "Delete permanently"** action is added alongside it. It
calls the stock top-level `deleteEvent` mutation (`IndexService.removeEvent`),
which removes the event from the search index for good, and it carries a
distinct, explicitly "permanent and irreversible" confirmation dialog.

- `@oc-mui/query`: add a `useDeleteEventPermanentlyMutation` hook for the stock
  top-level `deleteEvent`. Written out by hand rather than generated, following
  `useGetCurrentUser`: codegen introspects a live endpoint, so regenerating for
  one mutation would also import whatever else that backend exposes into the
  published types. Additive — `MuiDeleteEvent` keeps its existing soft
  `mui.deleteEvent` shape.
- `@oc-mui/plugin-core-episodes`: dual-delete UI in `ActionsCell` (soft "Move to
  trash" for everyone; admin-only destructive "Delete permanently"), each with its
  own confirmation dialog and toast.
- `@oc-mui/i18n`: new `episodes` keys (`action.moveToTrash`,
  `action.deletePermanently`, `trashDialogue.*`, `notification.trash*`).

The admin gate authorizes against the granted `roles` array from
`/info/me.json` and treats the organization's configured `org.adminRole` as
equivalent to `ROLE_ADMIN` — the same rule `AppProtection` and the sidebar
already use, so a deployment that renamed its admin role does not silently lose
the action. No second roles source is introduced.

Both dialogs render their body from an i18n **key** rather than a pre-rendered
string, so the escaping of the user-controlled event title lives in one place.
i18n runs with `escapeValue: false` globally, and with two dialogs sharing the
component a caller passing ready-made HTML would be one forgotten `escapeValue`
away from reopening the stored-XSS hole fixed in #266.
