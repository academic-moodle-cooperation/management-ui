# HAR replay

The manual test protocol, captured once and replayed forever.

A tester records their browser session while walking a section of
[`docs/operations/test-protocol.md`](../../docs/operations/test-protocol.md),
sanitizes it, and drops the file here. From then on the run is a test.

This is the only tier that sees a **real, org-specific deployment**: its
`config.json`, its JAR-deployed plugins, its actual data shapes. The mocked
smoke suite ([`tests/e2e/`](../e2e/README.md)) boots the default config with no
plugins; the integration suite ([`tests/integration/`](../integration/README.md))
runs against a vanilla podman Opencast. Neither can catch an org-config
regression. This tier can, and it does it without CI ever reaching that
deployment.

## Run

```bash
pnpm test:e2e:install     # one-time: Chromium
pnpm test:har-replay
```

With an empty `recordings/` every spec skips and no dev server starts, so the
command is safe to run (and to wire into CI) in a clone that has no recordings.

## Add a recording

```bash
# 1. Record: DevTools → Network → "Preserve log" → walk the flow →
#    right-click → "Save all as HAR with content"
# 2. Sanitize — NEVER skip this, a raw HAR contains session cookies
pnpm har:sanitize ~/Downloads/staging.har -o tests/har-replay/recordings/episodes.har
# 3. Replay
pnpm test:har-replay
```

The full tester-facing workflow, including what else to capture alongside the
HAR, is [`docs/operations/manual-test-recording.md`](../../docs/operations/manual-test-recording.md).

## What the specs assert

| Spec | Needs a browser | Checks |
|---|---|---|
| [`contract.spec.ts`](contract.spec.ts) | no | §4 GraphQL: every operation is `Mui`-prefixed, no response carried an `errors` array, no 5xx, and the file was actually sanitized. |
| [`replay.spec.ts`](replay.spec.ts) | yes | The shell boots against the recorded backend and renders without console errors. |

`contract.spec.ts` is the cheap, high-value half: it turns "the tester read the
Network tab" (protocol §4) into an assertion over real production traffic. A
GraphQL `errors` array behind a UI that still rendered — the class of bug that
produced the `EventOrderByInput` regression — fails here.

## How replay works

[`replay.spec.ts`](replay.spec.ts) calls `page.routeFromHAR(…, { notFound:
"fallback" })`. The recording answers the backend calls; everything it doesn't
match (the app's own ES modules, which the recorded deployment served as a
hashed production build) falls through to the local dev server. Because
`sanitize-har.mjs` rewrites the recorded origin to `http://127.0.0.1:3000` and
leaves paths alone, the URLs line up.

If the recording covered the org's plugin bundles
(`/management-ui/static/plugins/<org>/…`), those replay too — meaning the org's
actual shipped UI boots locally.

## Recordings are not committed

`recordings/*.har` is gitignored. The machinery here is shared; the data is
org-specific and stays with the org. Keep a recording set wherever that org
keeps its test artifacts, and restore it into this directory before a release
run.

## Limits

- **A recording is a snapshot.** It proves the flow worked on the day it was
  taken and detects drift when replayed against a newer frontend. It does not
  prove today's backend still answers the same way — that's what
  [`tests/integration/`](../integration/README.md) is for.
- **Recording ≠ flow coverage.** Replay boots the app; it does not re-drive the
  clicks. Pair a HAR with a DevTools Recorder export to also get the steps —
  see the workflow doc.
- **Sanitizing is lossy.** Names and emails become placeholders. Don't write
  assertions against personal data; assert on structure and counts.
