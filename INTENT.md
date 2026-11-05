# Intent — Management UI

> Written with `/intent-check` on 2026-08-21. Sessions working in this repo:
> check proposed work against this document, especially the non-goals.

## Purpose

The classic Opencast admin UI does not fit day-to-day editorial work. The
concrete pain: lectures are recorded and uploaded automatically, and the
editing/cutting that follows lands on support staff because lecturers have no
tool they can actually use. The Management UI exists to close that gap — let
the people who own the content manage it themselves.

Because every organisation's needs differ, customization happens through
plugins and themes, never through forks. And because everything is bound to
Opencast — a dependency the project does not control, which institutions are
often several versions behind on — modularity is existential: parts must be
updatable, upgradable, and replaceable independently. Long-term, the project
aims to grow an OSS plugin ecosystem around this base.

If it is never built: support staff stay the bottleneck for routine video
work, and every org keeps patching or forking UIs that drift apart.

## Audience

Two levels, deliberately distinct:

- **Primary (the "buyers"): developers and admins/operations** at
  institutions. They deploy the UI, shape it to fit their org, and build
  plugins for local needs. Extensibility must be flexible and easy — this is
  who the project is pitched to, and who decisions optimize for in doubt.
- **End users (vary per org): lecturers and their delegates.** Lecturers
  self-record in the lecture hall (automated capture), the content lands in
  the Management UI, and they administer it themselves. Tutors or appointed
  staff upload and manage material on lecturers' behalf. Dedicated video
  teams barely exist at the target institutions.

## Success

- Organisations outside the founding environment deploy it and build their
  own plugins.
- The Opencast community recognizes it — references it as a standard UI
  option.
- Plugin velocity: a new org-specific requirement becomes a working plugin
  in days, not weeks.

## Non-goals (deliberately rejected)

- **Feature parity with the old admin UI** — explicitly not a goal.
  Deliberately fewer features, done better.
- **In-tree feature growth** — features grow as plugins, not as shell/core
  extensions, even when in-tree would be quicker.
- **Viewer portal / player pages** — not a goal *now*. Conceivable on this
  base later, but nothing may depend on it.
- **Replacing the Opencast admin UI entirely** — same status: imaginable
  someday, not the primary goal. Server/workflow administration stays in the
  classic admin UI for now.

### Marketplace non-goals

- **One-click permanent installation** — "Try" loads a plugin ephemerally in
  the browser for evaluation; making it permanent goes through the
  controlled ops/deployment path (config + JAR). The marketplace is a
  showroom with test drives, not a package manager.
- **Monetization** — no paid plugins, no license/purchase handling.
- **Usage telemetry** — no install counts or popularity metrics phoning
  home.
- **Star ratings** — not important for this audience; trust comes from
  curation and provenance instead.

## Marketplace intent

The marketplace is an **admin-facing surface** (org admins see it, not end
users). Its job is **catalog & discovery** and being the **ecosystem
showcase**: make visible what exists, let admins try plugins ephemerally,
and let them enable features for their whole org or specific groups. When an
org publishes a plugin, other orgs should be able to discover and try it.
It is the shop window that makes people want to build plugins — that framing,
not install mechanics, is what its UX should be optimized for.

## Constraints

- Bound to Opencast; institutions lag several Opencast versions behind, so
  the project maintains parallel release lines (currently OC 19/20) and must
  keep parts independently upgradable.
- Licensed ECL-2.0; the six plugin contracts are frozen for the 1.x line.
- Repo content stays generic — no org, user, or host names in docs,
  comments, fixtures, or prompts. Org-specific plugins live outside the tree
  (`.local-plugins/`).
- All docs in English.
- Publishing runs through pnpm + changesets exclusively.

## Working mode

As codified in `AGENTS.md`: PR flow against `develop`, `pnpm verify` as the
pre-push gate, a committed changeset for every versioned-package change, and
docs updated in the same PR that makes them stale. Feature work happens in
worktrees/branches; org plugins are tested separately from the OSS gate.

## Open questions

- **Central registry**: working hypothesis — a project-provided curated
  registry of standard plugins, extendable by third-party submissions that
  pass review. Direction favored, decision deliberately open (operational
  and governance costs unassessed).
- **Reviews/comments on plugins**: maybe later; star ratings are out (see
  non-goals), but qualitative comments between orgs might carry value.

## Changelog

- 2026-08-21 — Initial version from intent interview (audit mode; project
  scope plus marketplace focus).
