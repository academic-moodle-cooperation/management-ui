# Recording a manual test run

**For testers.** You are already walking the
[release test protocol](./test-protocol.md) by hand. This page adds three
things to that walk — a recording, a step capture, and an environment snapshot —
that together turn your session into permanent automated tests.

Nothing to install. It costs about two extra clicks per protocol section.

> **Why it matters.** Automated tests today run against the default config with
> no org plugins, or against a plain local Opencast. Your run is the *only* time
> anyone exercises the real deployment: its `config.json`, its JAR-deployed
> plugins, its actual data. Everything you capture is something CI can then
> check forever — without CI ever getting access to that deployment.

## Before you start

1. Use a **fresh browser profile or a private window**, signed in only to the
   instance under test. Everything the browser does gets recorded.
2. Open DevTools (`F12` / `⌥⌘I`) → **Network** tab.
3. Tick **Preserve log**. Without it, the recording resets on every navigation
   and you lose most of the session.
4. Leave **Disable cache** *off* — a realistic recording is more useful than an
   artificially cold one.

## Per protocol section: ⏺ start / ⏹ stop

The protocol marks the sections worth recording with ⏺ **REC**. For each one:

| | Step |
|---|---|
| ⏺ | **Start** — in DevTools → Network, click the 🚫 *Clear* button. That's your start marker. |
| | Walk the section's checks as usual. Mark ✅/❌/➖ as you go. |
| ⏹ | **Stop** — right-click anywhere in the request list → **Save all as HAR with content**. Name it `<section>-<YYYY-MM-DD>.har`, e.g. `03-episodes-2026-08-04.har`. |

That's it. One clear at the start, one save at the end.

**"with content" matters.** Plain "Save all as HAR" omits response bodies, and
the response bodies are the entire point — they're what let us assert that a
GraphQL call came back with data instead of an `errors` array.

## Also record the steps (optional, high value)

Chrome has a **Recorder** panel built in — no extension needed.

1. DevTools → `⋮` (top right) → **More tools** → **Recorder**.
2. **Create a new recording**, name it after the protocol section, **Start**.
3. Click through the section normally.
4. **End recording** → **Export** → *JSON*. Save next to the HAR.

The HAR gives us the *backend*; the Recorder JSON gives us the *steps*. Together
they're a complete, runnable test of the flow you just did by hand.

Free bonus: wherever the Recorder had to fall back to a brittle XPath selector
instead of a readable `aria/…` or `text/…` one, that's a spot in the UI with no
stable, accessible handle. Those exports are a ready-made to-do list for the
developers — and fixing them improves screen-reader support at the same time.

## Snapshot the environment (once per run)

So we know what "the deployment as tested" actually was. In a browser tab or
via `curl`, save each of these next to the recordings:

| File | Where |
|---|---|
| `config.json` | `<instance>/ui/config/management-ui/config.json` |
| `plugins.json` | `<instance>/management-tool/ui/config/plugins.json` |
| version note | The build/version shown in the UI footer, plus the org plugin's version. |

Without these we can replay *what* happened but not reproduce *which* build and
config it happened on.

## ⚠️ Sanitize before you share

**A raw HAR is a credential.** It contains your session cookies, CSRF tokens,
and every name, email address and event title the backend returned. Treat the
file like a password:

- Do **not** attach it to a public issue, a chat channel, or an email thread.
- Hand it over the same way you'd hand over an access token.

A developer runs it through the sanitizer before it goes anywhere:

```bash
pnpm har:sanitize ~/Downloads/03-episodes-2026-08-04.har -o tests/har-replay/recordings/episodes.har
```

That strips cookies and auth headers, drops third-party traffic, replaces names
and emails with stable placeholders, rewrites the instance hostname to a local
one — and then re-scans its own output and **refuses to write the file** if
anything credential-shaped survived. See
[`scripts/sanitize-har.mjs`](../../scripts/sanitize-har.mjs).

## Report findings as test cases, not prose

When a check fails, write it in the shape a test can be built from:

```
Section:   3.1 Episodes
Clicked:   /episodes → column header "Created" (2nd click, descending)
Expected:  list re-sorts, no error
Saw:       list empties, red toast "unknown error"
Recording: 03-episodes-2026-08-04.har  (13:42)
```

Then classify it, so the fix lands at the right layer — this is the rule from
[`testing.md`](./testing.md#every-manual-run-feeds-automation):

| The bug is… | Becomes a… |
|---|---|
| pure logic (a formatter, a sort field, a config parse) | unit test |
| a plugin not registering, manifest drift, console error on load | contract test |
| a broken user flow | E2E spec |
| only reproducible against a real backend | integration spec, or a HAR recording |

## What we do with it

| You hand over | It becomes |
|---|---|
| Sanitized HAR | [`tests/har-replay/`](../../tests/har-replay/README.md) — the shell boots against your recorded backend in CI, and every GraphQL exchange you triggered is checked for `Mui` naming and error-free responses. |
| Recorder JSON | The click path for a new E2E spec, plus a list of UI elements missing a stable handle. |
| `config.json` / `plugins.json` | Fixtures for the config-driven specs, and the input for [`tests/org-plugin/`](../../tests/org-plugin/README.md). |
| Annotated protocol | Which rows are actually relevant here — the ones you always run get automated first, the ones you always skip get deleted. |

## What still needs a human

Being honest about the target: recordings can retire most of the protocol, not
all of it. What stays is judgment — "does this feel right", the first pass after
new infrastructure lands, and anything about real content that only a person who
knows the material can evaluate. Aim for a short smoke plus exploratory testing,
not zero.

## See also

- [`docs/operations/test-protocol.md`](./test-protocol.md) — the protocol itself.
- [`docs/operations/testing.md`](./testing.md) — the test pyramid these artifacts feed.
- [`tests/har-replay/README.md`](../../tests/har-replay/README.md) — the replay tier.
- [`tests/org-plugin/README.md`](../../tests/org-plugin/README.md) — org-plugin coverage.
