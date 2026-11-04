---
"@oc-mui/plugin-core-upload": patch
---

Send the episode Dublin Core catalog to `/ingest/addDCCatalog` as a urlencoded body carrying the raw XML instead of a hand-percent-encoded multipart field. Opencast does not URL-decode multipart form fields, so the catalog arrived as `%3C%3Fxml…` and every upload failed with HTTP 500 ("Content is not allowed in prolog").
