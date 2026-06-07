---
"@oc-mui/plugin-live-polls": minor
---

Add the **Live Polls** showcase plugin (audience response / SRS). Build poll decks
(single/multiple choice, scale, word cloud, quiz), optionally link a deck to an
Opencast series, run a live session with a join code, and watch results animate
live across browser tabs. Real-time fan-out uses a local `BroadcastChannel` +
`localStorage` transport behind a `SessionTransport` interface, so a real backend
can be dropped in later without UI changes.
