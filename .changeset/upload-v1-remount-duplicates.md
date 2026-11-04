---
"@oc-mui/plugin-core-upload": patch
---

Navigating away from the upload page and back while files were uploading started the current file again on every re-mount (and once more per change of the series id, which the mount effects briefly blanked), producing duplicate episodes, some without a series, a progress bar fed by several requests at once, and finished files re-appearing in the queue. Running uploads are now registered per file so a re-mount leaves them alone, the series id is no longer overwritten with the pre-route placeholder, and a late completion no longer corrupts the persisted upload list.
