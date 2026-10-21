# Issue workflow

Issues live on GitHub. That is where you report, discuss, and where a pull request references them. Planning — epics, roadmap, iterations, workflow status — happens in a separate planning tool (a GitLab instance operated by the maintainers) that holds a read-only *shadow issue* for every GitHub issue. A small mirror keeps the two in sync in one direction, and copies the planning status back to GitHub as a label so that everyone can see where an issue stands.

If you only report or fix issues, two things matter:

- **Everything you write goes on GitHub.** Comments, questions, proposals. Nothing you need is hidden in the planning tool.
- **Reference issues from pull requests with `refs #123`, never `closes #123`.** An issue is closed when it is *delivered*, which the maintainers decide in the planning tool. A `closes` keyword would close it at merge time, long before that.

## Status

Every issue carries exactly one `status::…` label. On GitHub the label is informational: it is written by the mirror and overwritten within minutes if changed by hand.

| Status | Meaning | Next step when |
| --- | --- | --- |
| `status::triage` | New. Details, priority or estimate still missing | Description complete, priority and estimate set |
| `status::backlog` | Ready for development | Scheduled into an iteration or an epic |
| `status::planned` | Scheduled, up next | A pull request references the issue (automatic) |
| `status::in-progress` | Being implemented | The pull request is merged (automatic) |
| `status::testing` | Development done, test planned or running | Test passed; otherwise back to in-progress |
| `status::review` | Test done, final check by the product owner | Approved; otherwise back to in-progress |
| `status::deploying` | Approved, delivery scheduled | Delivered |
| `status::done` | Delivered. The mirror closes the GitHub issue | — |

Two transitions are automatic and driven by pull request events: a PR that references an issue moves it to `in-progress` when opened, and to `testing` when merged (clearing the assignee, so testers see the issue as unclaimed). All other transitions are made by people on the planning board.

An issue closed on GitHub for another reason (duplicate, not planned) closes the shadow issue too; its status label stays as it was. Reopening on GitHub puts it back to `triage`.

## What the mirror owns

| Field | Owner | Direction |
| --- | --- | --- |
| Title, description, open/closed | GitHub | GitHub → planning tool, overwritten there |
| Labels without a `::` scope (`bug`, `enhancement`, …) | GitHub | GitHub → planning tool |
| Every scoped label (`status::…`, any other `x::y`) | planning tool | `status::` → GitHub as a read-only label |
| Comments on GitHub | GitHub | copied into the shadow issue as read-only notes, updated when edited |
| Notes written in the planning tool | planning tool | never copied back |
| Epic, iteration, weight, milestone, assignee | planning tool | never copied |

GitHub comments appear in the shadow issue as notes headed "GitHub-Kommentar von @user am <date>" with a link back; they carry a hidden `<!-- gh-comment <id> -->` marker so an edit on GitHub updates the note instead of adding a second one. Replying to such a note in the planning tool reaches nobody on GitHub.

The shadow issue has the same number as the GitHub issue. Its description starts with a banner linking back to GitHub and a hidden marker (`<!-- gh-mirror owner/repo#123 -->`); the mirror refuses to touch an issue without that marker. `#123` and `@user` references in the body are rewritten to GitHub links, because the same text would point at a different issue or person in the planning tool.

## How it runs

The logic is one script, [`.github/scripts/gitlab-mirror/mirror.mjs`](https://github.com/academic-moodle-cooperation/management-ui/blob/develop/.github/scripts/gitlab-mirror/mirror.mjs) (Node 22, no dependencies), with event-driven and polling commands:

| Command | Effect |
| --- | --- |
| `issue <n> <action>` | Upserts one shadow issue (GitHub `issues` event) |
| `pr <n> <action>` | Status transition + a note with the PR link (GitHub `pull_request` event) |
| `reconcile` | Re-syncs every issue (fields and comments), or only those updated within `SINCE` (e.g. `SINCE=30m`) |
| `pr-sync` | Polling variant of `pr`: every PR updated within `SINCE`; a hidden marker in the note keeps it from applying twice |
| `status-to-github` | Copies `status::` labels to GitHub, closes GitHub issues on `done`, optionally sets the project Status field |
| `backfill` | Initial import; needs a token that may set issue numbers (Owner) |

Where it runs depends on the network: the planning instance has to accept connections from wherever the job executes.

- [`.github/workflows/gitlab-mirror.yml`](https://github.com/academic-moodle-cooperation/management-ui/blob/develop/.github/workflows/gitlab-mirror.yml) is the GitHub Actions variant. It is kept for manual runs (`workflow_dispatch`) and documents the event triggers to re-enable if GitHub-hosted runners can reach the planning instance.
- The maintainers' deployment runs the polling variant as a scheduled CI job on the planning side every 10 minutes (`reconcile` with `SINCE`, `pr-sync`, `status-to-github`), fetching the script from this repository's `develop` branch, because the planning instance does not accept connections from GitHub-hosted runners. Latency is then up to 10 minutes in both directions.

Configuration per repository: the secret `GITLAB_TOKEN` (a group access token with `api` scope) and the variables `GITLAB_URL` and `GITLAB_PROJECT_ID`. Optionally the secret `GH_PROJECT_TOKEN` (a personal token with the `project` scope; the Actions token cannot write organization projects) and the variable `GH_PROJECT_NUMBER`: then `status-to-github` also sets the Status field of that organization project, adding issues that are not in it yet. The field's options must be named like the statuses above (`In progress`, `Done`, …). `DRY_RUN=1` makes every command print its plan without writing, which is the way to test a change locally:

```bash
GITHUB_TOKEN=$(gh auth token) GITHUB_REPOSITORY=owner/repo \
GITLAB_URL=https://gitlab.example.org GITLAB_TOKEN=… GITLAB_PROJECT_ID=12 \
DRY_RUN=1 node .github/scripts/gitlab-mirror/mirror.mjs reconcile
```

Another repository reuses the workflow without copying the script: a caller workflow with the same triggers that `uses: academic-moodle-cooperation/management-ui/.github/workflows/gitlab-mirror.yml@develop`, passes its own `GITLAB_PROJECT_ID` and `GITLAB_URL` as inputs and inherits its secrets. The script is always checked out from this repository, so a fix here reaches every caller.
