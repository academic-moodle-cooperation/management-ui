---
"@oc-mui/plugin-core-episodes": patch
"@oc-mui/utils": minor
---

fix(episodes): keep the file extension on downloaded tracks

The download link handed the raw event title to the browser's `download`
attribute. A title containing a dot (`Vorlesung 3.2 Einführung`) was read as
already carrying an extension, so the file was saved without `.mp4` and
Windows reported an unknown format.

Adds `buildDownloadFileName` to `@oc-mui/utils`, which appends the real
extension — taken from the track path, falling back to its MIME type — and
strips characters Windows rejects in file names.
