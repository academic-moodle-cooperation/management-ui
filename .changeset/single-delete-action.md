---
"@oc-mui/plugin-core-episodes": minor
"@oc-mui/i18n": patch
---

The episodes table offers one delete action for every role. The admin-only
"Delete permanently" entry (the index-level removal) is gone from the UI; the
remaining **Delete video** action runs the deployment's configured delete
workflow (`mui.deleteEvent`, typically a trash series) and confirms with
"Delete video? — Are you sure you want to delete the video …?" (Delete /
Cancel). Translation keys renamed accordingly: `episodesTable.action.delete`,
`episodesTable.deleteDialogue.{heading,text}`,
`episodesTable.notification.{deleteSuccess,deleteError}`; the `moveToTrash`,
`deletePermanently`, `trashDialogue` and `trash*` notification keys are
removed.
