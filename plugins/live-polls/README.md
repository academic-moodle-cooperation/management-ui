# @oc-mui/plugin-live-polls

A **Student Response System** (audience response / live polling, à la Particify or
the univie SRS) built as an in-tree showcase plugin for the Management UI. It is a
deliberately non-trivial reference: stateful, real-time, multi-view, and visual — a
good stress test of what a plugin can do on this platform.

## What it does

- **Deck manager** (`/live-polls`) — create poll decks, optionally link one to an
  Opencast series, edit, duplicate, present.
- **Editor** — five question types: single choice, multiple choice, scale, word
  cloud, and scored quiz.
- **Presenter** (`/live-polls/present`) — a join code + link, live-updating results
  (animated bars, scale histogram, word cloud, quiz leaderboard), and step controls.
- **Audience** (`/live-polls/join?code=…`) — join by code and answer; results stream
  in live.

## How the "live" part works

The whole session is an **append-only event log**. Every tab — presenter and
participants — reduces the same log into a snapshot (`transport/aggregate.ts`, all
pure and unit-tested). Fan-out is handled by a `SessionTransport`:

- `LocalSessionTransport` (shipped) uses `BroadcastChannel` + `localStorage`, so the
  demo is genuinely live across tabs/windows on one machine — **no backend**.
- The interface is the seam for a real classroom: a `WebSocketSessionTransport` (or a
  Java backend bundle like the univie plugin ships) can replace it with **no changes**
  to the hooks or UI.

> Because every plugin route in the shell is auth-gated, the local-transport demo
> treats "the audience" as other tabs in the same authenticated session. A real
> multi-device deployment additionally needs a public join route + a networked
> transport — both intentionally out of scope for this showcase.

## Layout

```
src/
  index.ts            createPlugin: apps:definitions + sidebar:nav-items + config
  App.tsx             routeSubPath → list | edit | present | join
  config.ts           zod config slice (definePluginConfig)
  i18n.ts             registers the bundled live-polls namespace
  types.ts            Deck / Question / SessionEvent / SessionState
  transport/          SessionTransport, LocalSessionTransport, aggregate (+ tests)
  storage/            deckStore (+ tests)
  hooks/              useDecks, useSession, useParticipant
  components/         DeckManager, DeckEditor, QuestionEditor, PresenterView,
                      ParticipantView, AnswerForm, Results, Leaderboard, JoinCode
locales/live-polls/   en.json, de.json
```

## Try it

`pnpm dev` → open `/management-ui/live-polls`, build a deck, hit **Present**, then
open the **audience view** in a second tab and answer. Watch the presenter update
live.
