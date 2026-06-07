# Test automation plan (handoff)

**Status:** Working plan / handoff. Not yet canonical.
**Created:** 2026-06-07
**Base branch:** `release/oss-1.0`
**Owner branch:** `claude/eager-dubinsky-f53974`
**Purpose:** Capture the agreed plan for pushing the manual [release test
protocol](./test-protocol.md) toward full automation, now that a **dockerized /
podman Opencast** ([`hinkelstein-podman`](#podman--opencast-integration--design))
is available locally.

Unlike the cloud session that drafted the sibling `management-ui` mirror, this
plan was written with **read access to the local `hinkelstein-podman` repo**, so
the podman section below is filled in with the project's *actual* container
names, ports, credentials, and deploy paths rather than left as open questions.
The handful of values that still depend on the operator's machine (the
host-reachable base URL, the Opencast major version, whether a Management-UI JAR
is already built) are flagged **"confirm locally"** — they are the only things
the implementing session should verify before trusting the fixture.

Treat the code-shaped parts below as a design, not as final answers. The
integration + visual layers must be brought up and iterated **locally**, where
podman and the browser actually run — writing real-backend test infrastructure
you can't execute is guesswork.

---

## Why this exists

The repo already has a good, deliberate strategy (see [`testing.md`](./testing.md)):
a classic pyramid — many **unit** tests (Vitest), one **contract** test per
plugin (the `@oc-mui/plugin-testing` harness), and a thin **E2E** layer
(Playwright, one smoke spec against a mocked backend). On top of that sits the
human-run [`test-protocol.md`](./test-protocol.md): a 15-section walkthrough
against a **real** Opencast backend, run before a release.

The goal of this plan: shrink that 15-section manual protocol toward **near-zero
routine manual work**, by automating the sections that mock cleanly *and* the
sections that need a real backend — the latter is now unlocked because a
**podman Opencast** ("Hinkelstein") is available.

### What changed the calculus

Previously the real-backend sections (§10 JAR deploy, §11 marketplace CDN load,
§15 auth) were "leave manual" purely because standing up a real Opencast in CI
was expensive. The owner now runs **Opencast under podman** via
`hinkelstein-podman` (`./runtime.sh start <version>`). That removes the blocker —
those sections become ordinary engineering work, not infrastructure projects.

---

## Honest assessment of the current strategy

**Good:**

- Single canonical strategy doc ([`testing.md`](./testing.md)) + a real release
  checklist ([`test-protocol.md`](./test-protocol.md)). Ahead of most projects.
- Contract test per plugin catches the most common bug class (manifest ↔
  `initialize()` drift) automatically and mechanically. **All five plugins**
  (`core-episodes`, `core-series`, `core-upload`, `admin-marketplace`, `example`)
  already ship a `plugin.contract.test.ts`.
- `pnpm verify` mirrors CI: `lint` → `check-types` → `build` → `test` (unit) →
  `test:contract` → `api-check`, then `pnpm test:e2e` (Playwright smoke). CI
  splits the same work across the `lint-types`, `unit`, `contract`, `api-check`,
  and `e2e` jobs in [`.github/workflows/test.yml`](../../.github/workflows/test.yml).

**Gaps (in priority order):**

1. **Thin E2E coverage** — only [`tests/e2e/smoke.spec.ts`](../../tests/e2e/smoke.spec.ts)
   exists. No real user flows (upload, create-series, marketplace activation)
   are exercised in a browser. This is the weakest spot.
2. **No coverage gates** — coverage is measured (`pnpm test:coverage`) and
   uploaded to Codecov, but nothing fails when it drops. Master-plan target was
   80% (foundation/integration packages) / 60% (apps). (Follow-up #3 in
   [`testing.md`](./testing.md).)
3. **No real-backend automated tests** — everything automated today mocks the
   backend (see the four `page.route(...)` stubs in `smoke.spec.ts`), so
   schema-drift bugs (e.g. the `EventOrderByInput` sort regression described in
   [`test-protocol.md`](./test-protocol.md) §4) can pass CI. The podman Opencast
   lets us close this.
4. **No visual regression** — theme/token regressions are only caught by a human
   eyeballing screens ([`test-protocol.md`](./test-protocol.md) §7). (Follow-up
   #6 in [`testing.md`](./testing.md).)

**Stale doc to fix:** [`testing.md`](./testing.md) Follow-up #1 says only
`core-episodes` has a contract test and lists `core-series`, `core-upload`,
`admin-marketplace`, `example` as TODO. The tree shows **all of them already
have `plugin.contract.test.ts`** (verified on `release/oss-1.0`). Follow-up #1
should be deleted.

---

## Can testing be fully automated? The realistic answer

Almost. With the podman Opencast available, **all 15 protocol sections are
automatable.** The irreducible manual residue shrinks to:

- The first-time human confirmation when new test infrastructure is wired up.
- True UX / "does it feel right" judgment that pixel-diffs approximate but don't
  fully replace.
- Genuinely new integrations against systems not yet covered.

So the target is **not** "zero manual" but "**the manual protocol shrinks every
release**" — it becomes a "when we build something genuinely new" document
rather than a per-release slog.

---

## Per-section automation map (the 15 sections of `test-protocol.md`)

| § | Section | Automatable? | How |
|---|---|---|---|
| 1 | Workspace baseline | ✅ Already | `pnpm verify` + `pnpm api-check` |
| 2 | Shell boots cleanly | ✅ Easy | Extend the Playwright smoke spec (mocked backend) |
| 3 | Built-in plugin features | ✅ Medium | E2E flows; mocked backend for PR speed, **real** backend job for truth |
| 4 | GraphQL data flow | ✅ High value | Playwright asserts on request payloads (`Mui`-prefixed ops, `data` not `errors`); run against the **real** schema to catch drift |
| 5 | i18n | ✅ Easy | DOM assertions after language switch |
| 6 | Configuration | ✅ Easy | Serve edited `config.json`, assert DOM/behavior |
| 7 | Theming | ✅ Medium | DOM/CSS-var assertions **+ visual regression** (see below) |
| 8 | Plugin scaffolding | ✅ Easy | Shell out to `pnpm create-plugin`, assert generated tree |
| 9 | `.local-plugins/` loading | ✅ Easy | Build + serve, assert activation log / manifest |
| 10 | JAR build + deploy | ✅ Now unlocked | `mvn package` → `podman cp` JAR into `opencast-runtime:/opt/opencast/deploy/` → wait for Felix fileinstall → reload shell → assert effect |
| 11 | Marketplace (CDN load) | ✅ Now unlocked | Host `dist/*.mjs`, drive Developer Mode Try/Install/Uninstall |
| 12 | Contracts enforcement | ✅ Mostly mechanical | Scripted lint/api-check assertions |
| 13 | CI gates | ✅ Already | The workflows themselves |
| 14 | Documentation site | ✅ Easy | `pnpm docs:build` + link-check + assert noindex guards |
| 15 | Authentication | ✅ Now unlocked | Drive the real Opencast login (`POST /j_spring_security_login`); assert `useGetCurrentUser()` populates |

**Net:** ~11 sections are "automate with effort, no backend needed"; the 3
real-backend sections (§10/§11/§15) are unlocked by podman; §4 and §3 get
*better* when pointed at the real backend.

---

## Target end-state architecture

Three Playwright projects + the existing Vitest layers:

1. **Standard E2E (mocked backend)** — fast PR feedback. Covers §2–§9, §12–§14.
   Reuses the route-mock pattern from [`tests/e2e/smoke.spec.ts`](../../tests/e2e/smoke.spec.ts).
   This is the existing `playwright.config.ts`.
2. **Integration E2E (real podman Opencast)** — slower, separate CI job /
   separate config (`playwright.integration.config.ts`). Covers §3 (real data),
   §4 (real GraphQL/schema), §10/§11/§15. Brought up via a Playwright
   global-setup that **health-checks** the podman Opencast (and optionally
   starts it) and waits for it to be ready.
3. **Visual regression (in-container Playwright)** — own job. Snapshots default
   + dark + one alternate theme (e.g. Oxford Navy) for §7. Rendered inside a
   fixed container for byte-stable output.

Plus existing **unit** + **contract** layers unchanged.

---

## Automated visual testing — design

This is Follow-up #6 in [`testing.md`](./testing.md) ("Visual regression —
Playwright screenshot diffs across the default theme + at least one alternate
theme, gated behind a separate job because of flake risk"). It is fully doable.

**Approach (Route A — Playwright built-in, in-repo, free):**

- `await expect(page).toHaveScreenshot()` records a baseline PNG on first run,
  then diffs pixel-by-pixel on later runs and fails on drift.
- Snapshot: default light theme, dark theme, one alternate showcase theme, on a
  few key screens (shell shell/sidebar, episodes table, series table).

**Approach (Route B — cloud visual service):** Argos / Percy / Chromatic add a
review UI ("here's what changed, approve/reject") and host baselines. More
polished, costs money / another service. Default to Route A first; revisit B
only if the review workflow becomes painful.

**Why the container matters here:** screenshot diffs are flaky across OS/GPU and
especially **font rendering**. Rendering inside the **same container** every
time (local + CI) produces deterministic output and kills most flake. The podman
setup is exactly what makes this viable — that's why the doc gated it "behind a
separate job because of flake risk."

**Flake-mitigation checklist (apply to every visual spec):**

- Render screenshots inside the fixed container; pin the browser version.
- Fixed viewport size.
- Disable animations + caret (`reducedMotion`, CSS overrides).
- Wait for web fonts to finish loading before snapshotting.
- `mask:` dynamic regions (timestamps, random IDs, avatars).
- Allow a small `maxDiffPixelRatio` / `maxDiffPixels` threshold.
- Commit baselines from an in-container run, never from a dev laptop.

---

## podman / Opencast integration — design

The integration-E2E project needs a global-setup that ensures the Opencast
container is up and healthy before any spec runs (and, for §10, can `podman cp` a
JAR into it). The facts below come from the local
[`hinkelstein-podman`](../../../hinkelstein-podman) checkout.

### Known facts (from `hinkelstein-podman`)

| Thing | Value | Source |
|---|---|---|
| Compose file | `compose/docker-compose.yml` (or `…-gpu.yml`) | `runtime.sh` |
| podman-compose project name | `hinkelstein` | `runtime.sh` (`PROJECT_NAME`) |
| Opencast container name | `opencast-runtime` | `compose/docker-compose.yml` |
| Host port | `8080:8080` (published to the host) | `compose/docker-compose.yml` |
| Server URL inside Opencast | `http://opencast-runtime:8080` | `env.sh` (`ORG_OPENCASTPROJECT_SERVER_URL`) |
| Admin credentials | `admin` / `livestream` | `compose/docker-compose.yml` |
| Digest credentials | `opencast_system_account` / `livestream` | `compose/docker-compose.yml` |
| GraphQL endpoint | `POST /graphql` | MUI config |
| Management UI base path | `/management-ui/` | Opencast static mount |
| Login (form POST) | `POST /j_spring_security_login` with `j_username` / `j_password` | Spring Security |
| Health signal | `GET /info/me.json` → `200` (public; returns the anonymous user before login) | Opencast REST |
| Karaf deploy dir | `/opt/opencast/deploy` (Felix fileinstall, polls every 30 s) | `org.apache.felix.fileinstall-deploy.cfg` |
| Bring-up command | `./runtime.sh start <opencast-major-version>` | `README.md` |

### Confirm locally (the only real unknowns)

- [ ] **Host-reachable base URL.** Opencast's own `server.url` is
  `http://opencast-runtime:8080`, and Opencast is picky about the host header
  matching it (auth redirects, CORS). So the safest base URL from the host is
  `http://opencast-runtime:8080` **with an `/etc/hosts` entry**:
  `127.0.0.1 opencast-runtime`. If you instead hit `http://localhost:8080` and
  see login redirects misbehave, that mismatch is why. The fixture reads
  `OPENCAST_BASE_URL` (default `http://opencast-runtime:8080`) so you can
  override without code changes.
- [ ] **Opencast major version** you run with `./runtime.sh start <version>`
  (e.g. `18`). The §10 JAR target dir is `target/<version>/jar/`. Exposed to the
  fixture as `OPENCAST_VERSION`.
- [ ] **Is a Management-UI JAR already built and deployed?** `runtime.sh` copies
  `target/<version>/jar/*` into the container's `deploy/` at build time; for §10
  the fixture instead `podman cp`s a freshly-`mvn package`d JAR at test time.
- [ ] **Credentials to seed §15.** Default `admin` / `livestream`; override via
  `OPENCAST_USER` / `OPENCAST_PASS`.

### Fixture design (default = assume-running, opt-in start)

The global-setup should **not** build Hinkelstein from sources (that compiles
Opencast — minutes-to-hours and may need VPN access to univie infra). Instead:

1. Poll `GET ${OPENCAST_BASE_URL}/info/me.json` until `200` (or timeout).
2. If it never comes up **and** `OPENCAST_AUTOSTART=1`, shell out to
   `hinkelstein-podman/runtime.sh start ${OPENCAST_VERSION}` once, then re-poll.
   Otherwise fail with a clear "start your podman Opencast first" message.
3. Tear-down is a no-op by default (leave the long-lived container running);
   only stop it if the fixture started it *and* `OPENCAST_AUTOSTOP=1`.

### Known podman-specific gotchas (real, solvable)

- **`/etc/hosts`.** `env.sh` itself errors if `opencast-runtime` doesn't resolve
  when `HOSTNAME` maps to `127.0.0.1`. The fixture's default base URL assumes the
  same `127.0.0.1 opencast-runtime` line.
- **Testcontainers / a Docker socket are *not* required** for this design — the
  fixture talks HTTP to an already-published `:8080` and shells `podman`/`podman
  cp` directly. (If a future spec wants Testcontainers, rootless podman needs
  `DOCKER_HOST=unix://$XDG_RUNTIME_DIR/podman/podman.sock` and often
  `TESTCONTAINERS_RYUK_DISABLED=true`.)
- **GitHub Actions `services:` blocks are Docker-based.** If integration CI runs
  on GH Actions, start podman manually in a step (preinstalled on Ubuntu
  runners) rather than using `services:`, or use a self-hosted runner. Locally
  with podman it's seamless.
- Decide: should the integration + visual jobs run **per-PR** (slower, full
  confidence) or **nightly / pre-release only** (faster PRs, real-backend truth
  on a schedule)? Recommend nightly + pre-release to start, promote to per-PR if
  stable.

---

## Prioritized task list

Work top-down; each task is independently shippable.

- [ ] **0. Doc cleanup.** Delete the stale Follow-up #1 in
  [`testing.md`](./testing.md) (all plugins already have contract tests). Add a
  short "convert manual findings into tests" subsection (see rule below).
- [ ] **1. Integration-E2E Playwright project + podman fixture.** A separate
  `playwright.integration.config.ts` and a global-setup that health-checks (and
  optionally starts) the podman Opencast, parameterized by the env vars above.
  First specs: §4 GraphQL (assert `Mui`-prefixed operations return `data`, not
  `errors`, against the *real* schema) + §3 episodes list/sort.
- [ ] **2. §3 plugin flows.** Series create-dialog flow, upload UI render,
  marketplace list. Mocked-backend versions for the standard project where
  possible; real-backend versions in the integration project.
- [ ] **3. §5–§7 (mocked).** i18n switch, config consumption, theming
  DOM/CSS-var assertions in the standard project.
- [ ] **4. Visual-regression Playwright project.** In-container rendering;
  baselines for default + dark + one alternate theme on key screens (§7). Apply
  the flake-mitigation checklist.
- [ ] **5. §10 JAR deploy.** `mvn package` → `podman cp` into
  `opencast-runtime:/opt/opencast/deploy/` → wait for Felix fileinstall (poll
  `plugins.json`) → reload shell → assert plugin effect.
- [ ] **6. §11 marketplace CDN + §15 auth** against the real backend.
- [ ] **7. Coverage gates.** Measure current per-package coverage, then enforce
  thresholds (target 80% libs / 60% apps). Codecov already ingests uploads; only
  the gates are missing (Follow-up #3).
- [ ] **8. CI wiring.** Add integration + visual jobs (nightly/pre-release to
  start). Decide promotion-to-per-PR criteria.
- [ ] **9. Update docs.** As each section is automated, mark it in
  [`test-protocol.md`](./test-protocol.md) and prune the corresponding follow-up
  in [`testing.md`](./testing.md). The protocol should shrink to the
  genuinely-manual residue.

---

## The discipline to adopt: every manual run feeds automation

When a manual run finds a bug, the bug is telling you which automated test was
missing. Convert it:

- **Pure logic bug** (formatter, sort field, config parse) → write a failing
  **unit test**, then fix.
- **Plugin not registering / manifest drift / console error on load** →
  strengthen that plugin's `plugin.contract.test.ts`.
- **Broken user flow** → add an **E2E spec** (the `EventOrderByInput` sort
  regression is the canonical example of something that should be a permanent
  E2E test).
- **Only-a-real-backend bug** → add/refine an **integration-E2E** spec (now
  possible with podman) and/or a row in [`test-protocol.md`](./test-protocol.md).

Rule: **every manual run either converts a found bug into a permanent automated
test, or adds/refines a checklist row.** Keep a filled-in protocol copy (date,
branch, backend version, runner) with each release for the audit trail.

---

## Constraints / ground rules for the implementing session

- Develop on the designated feature branch; commit with clear messages; push
  with `git push -u origin <branch>`.
- Respect [`AGENTS.md`](../../AGENTS.md): plugin import boundaries, the
  config-slice rule, the required contract test, changeset + `api-check` for any
  public-API change, and keep docs in sync in the same change.
- Run `pnpm verify` before declaring anything done.
- Don't commit generated files by hand (the generated-file guard hook blocks
  this).

---

## See also

- [`testing.md`](./testing.md) — the canonical (current) test strategy.
- [`test-protocol.md`](./test-protocol.md) — the manual release protocol being automated.
- [`packages/plugin-testing/README.md`](../../packages/plugin-testing/README.md) — contract-test harness API.
- [`tests/e2e/README.md`](../../tests/e2e/README.md) — how to run the Playwright suite.
- `hinkelstein-podman/README.md` — the podman Opencast this plan automates against.
