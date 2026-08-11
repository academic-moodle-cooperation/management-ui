---
"@oc-mui/ui": minor
---

Fix `AclEditor` rendering raw translation keys, and stop requiring props it doesn't need.

**The bug.** Every label in the component comes from the `muitable-sidebar`
namespace, but it bound `useI18n()` to the *default* namespace and merely
side-loaded the bundle from an effect. Not being subscribed, react-i18next had
no reason to re-render it once the bundle arrived, so the first time the editor
opened in a context that hadn't already loaded that namespace it showed bare
keys — `accessPolicy`, `accessList`, `addUser`, `noEntries`, `noPolicy` —
instead of text. It now subscribes with `useI18n("muitable-sidebar")`, which
both loads the namespace and re-renders when it is ready; the manual
`loadNamespace` effect is gone.

**The props.** `hasChanges`, `refetch` and `onHasChangesChange` were required
but only serve the "edit an existing entity, then press Update" flow. Callers
that collect an ACL for something which does not exist yet — an upload, for
instance — had to pass no-ops for all three. They are now optional with the
defaults the component already applied internally. Existing callers are
unaffected: this only relaxes the signature.
