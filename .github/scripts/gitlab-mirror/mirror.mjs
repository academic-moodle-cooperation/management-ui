#!/usr/bin/env node
/**
 * One-way mirror of GitHub issues into GitLab "shadow issues", plus the
 * status feedback channel GitLab → GitHub.
 *
 * Ownership rules (see docs/contribute/issue-workflow.md):
 *   GitHub owns   title, description, non-scoped labels, open/closed, comments.
 *   GitLab owns   every scoped label (`status::…`, any other `x::y`), its own notes,
 *                 epics, iterations, weight, milestones, assignees.
 *   GitHub comments are copied into the shadow issue as read-only notes (marked
 *   with a hidden `<!-- gh-comment <id> -->`); nothing is ever copied back.
 *   The mirror never touches what GitLab owns. The status channel only
 *   copies the `status::` label back to GitHub as a read-only label and
 *   closes the GitHub issue on `status::done`.
 *
 * Commands
 *   issue <number> [action]   sync one GitHub issue (issues event)
 *   reconcile                 sync every GitHub issue (nightly)
 *   backfill                  initial import, iid = GitHub number (needs Owner token)
 *   pr <number> <action>      PR event → status transition in GitLab
 *   pr-sync                   polling variant of `pr`: every PR updated within SINCE
 *   status-to-github          copy status:: GitLab → GitHub, close on done
 *
 * Event-driven (issue / pr) is what GitHub Actions uses; the polling variants
 * (reconcile with SINCE, pr-sync) are for a scheduled job on the planning side,
 * needed when the planning instance does not accept connections from GitHub's runners.
 *
 * Environment
 *   GITHUB_TOKEN, GITHUB_REPOSITORY (owner/repo)
 *   GITLAB_URL, GITLAB_TOKEN, GITLAB_PROJECT_ID
 *   GH_PROJECT_TOKEN, GH_PROJECT_NUMBER   optional: also set the Status field
 *                             of that org project (token needs the `project` scope)
 *   SINCE=30m                 reconcile / pr-sync: only items updated in the last 30m (or 2h, 1d)
 *   DRY_RUN=1                 print what would change, write nothing
 *
 * Zero dependencies, Node 22+.
 */

const env = (name, fallback) => {
  const v = process.env[name] ?? fallback;
  if (v === undefined || v === "") throw new Error(`Missing env ${name}`);
  return v;
};

const GH_TOKEN = env("GITHUB_TOKEN");
const REPO = env("GITHUB_REPOSITORY");
const GL_URL = env("GITLAB_URL").replace(/\/+$/, "");
const GL_TOKEN = env("GITLAB_TOKEN");
const PID = env("GITLAB_PROJECT_ID");
const DRY = process.env.DRY_RUN === "1";
const SINCE = (() => {
  const m = /^(\d+)([mhd])$/.exec(process.env.SINCE ?? "");
  if (!m) return null;
  const ms = Number(m[1]) * { m: 60e3, h: 3600e3, d: 86400e3 }[m[2]];
  return new Date(Date.now() - ms);
})();

const STATUS = {
  triage: "status::triage",
  backlog: "status::backlog",
  planned: "status::planned",
  inProgress: "status::in-progress",
  // Merged into develop, waiting for the next staging deploy. The deployer
  // moves the card to testing once the build is on staging.
  deployToTest: "status::deploy to test",
  testing: "status::testing",
  review: "status::review",
  deploying: "status::deploying",
  done: "status::done",
};
const isScoped = (name) => name.includes("::");
const isStatus = (name) => name.startsWith("status::");
const MARKER = (n) => `<!-- gh-mirror ${REPO}#${n} -->`;
// Repositories get renamed on GitHub (old names redirect); accept any owner/repo for the same number.
const isMirrorOf = (n, description) =>
  new RegExp(`<!-- gh-mirror [\\w.-]+/[\\w.-]+#${n} -->`).test(description ?? "");

const log = (...a) => console.log(DRY ? "[dry-run]" : "", ...a);

// ---------------------------------------------------------------- HTTP

async function request(url, { method = "GET", headers = {}, body } = {}) {
  let res;
  try {
    res = await fetch(url, {
      method,
      headers: { "content-type": "application/json", ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (e) {
    // undici's "fetch failed" hides the cause; surface it (ECONNREFUSED, ENOTFOUND, cert errors …)
    const cause = e.cause ? ` — ${e.cause.code ?? ""} ${e.cause.message ?? ""}`.trimEnd() : "";
    throw new Error(`${method} ${url.replace(/\?.*$/, "")} failed: ${e.message}${cause}`);
  }
  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) {
    const err = new Error(`${method} ${url} → ${res.status} ${text.slice(0, 300)}`);
    err.status = res.status;
    throw err;
  }
  return { data, res };
}
const safeJson = (t) => {
  try {
    return JSON.parse(t);
  } catch {
    return t;
  }
};

const gh = async (path, opts = {}) =>
  (
    await request(`https://api.github.com/${path}`, {
      ...opts,
      headers: {
        authorization: `Bearer ${GH_TOKEN}`,
        accept: "application/vnd.github+json",
        "x-github-api-version": "2022-11-28",
      },
    })
  ).data;

async function ghAll(path) {
  const out = [];
  for (let page = 1; ; page++) {
    const sep = path.includes("?") ? "&" : "?";
    const batch = await gh(`${path}${sep}per_page=100&page=${page}`);
    out.push(...batch);
    if (batch.length < 100) return out;
  }
}

const gl = async (path, opts = {}) =>
  (
    await request(`${GL_URL}/api/v4/${path}`, {
      ...opts,
      headers: { "PRIVATE-TOKEN": GL_TOKEN },
    })
  ).data;

async function glMaybe(path) {
  try {
    return await gl(path);
  } catch (e) {
    if (e.status === 404) return null;
    throw e;
  }
}

async function glAll(path) {
  const out = [];
  for (let page = 1; ; page++) {
    const sep = path.includes("?") ? "&" : "?";
    const batch = await gl(`${path}${sep}per_page=100&page=${page}`);
    out.push(...batch);
    if (batch.length < 100) return out;
  }
}

const write = async (what, fn) => {
  log(what);
  if (!DRY) return fn();
};

// ------------------------------------------------------- shadow content

/** Rewrite GitHub-only syntax so it does not point at the wrong thing in GitLab. */
function rewriteBody(body) {
  const parts = body.split(/(```[\s\S]*?```|`[^`\n]*`)/g);
  return parts
    .map((part, i) => {
      if (i % 2 === 1) return part; // inside code
      return part
        // owner/repo#123 → link
        .replace(
          /(^|[\s(])([\w.-]+\/[\w.-]+)#(\d+)\b/g,
          (_, pre, repo, n) => `${pre}[${repo}#${n}](https://github.com/${repo}/issues/${n})`,
        )
        // #123 → link into GitHub (PR numbers share the sequence; GitLab iids would mislead)
        .replace(
          /(^|[\s(])#(\d+)\b/g,
          (_, pre, n) => `${pre}[#${n}](https://github.com/${REPO}/issues/${n})`,
        )
        // @user → link, so GitLab does not ping an unrelated account of the same name
        .replace(
          /(^|[\s(])@([A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?)\b/g,
          (_, pre, u) => `${pre}[@${u}](https://github.com/${u})`,
        );
    })
    .join("");
}

function shadowDescription(issue) {
  const ref = `${REPO}#${issue.number}`;
  const author = issue.user?.login ?? "unknown";
  const banner = [
    `> **Spiegel von GitHub [${ref}](${issue.html_url})** · Titel, Beschreibung, Labels und Offen/Geschlossen kommen von GitHub und werden hier überschrieben.`,
    `> GitHub-Kommentare werden hierher kopiert, nur zum Lesen. Antworten an den Reporter gehören auf GitHub. Interne Notizen, Epic, Iteration und Weight werden hier gepflegt.`,
    `> Angelegt von [@${author}](https://github.com/${author}) am ${String(issue.created_at).slice(0, 10)}`,
  ].join("\n");
  return `${banner}\n\n${MARKER(issue.number)}\n\n${rewriteBody(issue.body ?? "")}`.trimEnd();
}

const ghLabelNames = (issue) =>
  (issue.labels ?? []).map((l) => (typeof l === "string" ? l : l.name)).filter((n) => !isScoped(n));

// ------------------------------------------------------------ labels

let glLabelCache;
async function glLabels() {
  glLabelCache ??= await glAll(`projects/${PID}/labels?include_ancestor_groups=true`);
  return glLabelCache;
}

/** Make sure every GitHub label used on an issue exists in the GitLab project. */
async function ensureGlLabels(issue) {
  const existing = new Set((await glLabels()).map((l) => l.name));
  for (const l of issue.labels ?? []) {
    const name = typeof l === "string" ? l : l.name;
    if (isScoped(name) || existing.has(name)) continue;
    const color = `#${(typeof l === "string" ? "" : l.color) || "cccccc"}`;
    await write(`create GitLab label ${name}`, () =>
      gl(`projects/${PID}/labels`, {
        method: "POST",
        body: { name, color, description: (typeof l === "string" ? "" : l.description) ?? "" },
      }),
    );
    existing.add(name);
    glLabelCache?.push({ name, color });
  }
}

// ------------------------------------------------------------ upsert

const same = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());

/**
 * Create or update the shadow issue for one GitHub issue.
 * @param issue GitHub issue (not a PR)
 * @param action GitHub event action, e.g. "reopened"
 */
async function upsertIssue(issue, action) {
  if (issue.pull_request) return;
  const n = issue.number;
  const existing = await glMaybe(`projects/${PID}/issues/${n}`);
  const description = shadowDescription(issue);
  const ghLabels = ghLabelNames(issue);
  await ensureGlLabels(issue);

  if (!existing) {
    const labels = [...ghLabels, issue.state === "closed" ? STATUS.done : STATUS.triage];
    await write(`create #${n} "${issue.title}" [${labels.join(", ")}]${issue.state === "closed" ? " closed" : ""}`, async () => {
      const created = await gl(`projects/${PID}/issues`, {
        method: "POST",
        body: { iid: n, title: issue.title, description, labels: labels.join(",") },
      });
      if (created.iid !== n) throw new Error(`#${n}: GitLab assigned iid ${created.iid} — token lacks Owner rights`);
      if (issue.state === "closed") {
        await gl(`projects/${PID}/issues/${n}`, { method: "PUT", body: { state_event: "close" } });
      }
    });
    return "created";
  }

  if (!isMirrorOf(n, existing.description)) {
    console.warn(`#${n}: GitLab issue ${n} exists but is not a mirror of ${REPO}#${n} — skipped`);
    return "skipped";
  }

  const keptScoped = existing.labels.filter(isScoped);
  const wantLabels = [...new Set([...ghLabels, ...keptScoped])];
  // A reopen resets the status to triage. In polling mode (`reconcile` with
  // SINCE) there is no event action, so detect it from the states: GitHub is
  // open while the shadow is still closed. Without this the shadow kept
  // `status::done`, and the next `status-to-github` closed the GitHub issue
  // again two minutes after someone had reopened it.
  const reopened = action === "reopened" || (issue.state === "open" && existing.state === "closed");
  if (reopened) {
    wantLabels.splice(0, wantLabels.length, ...wantLabels.filter((l) => !isStatus(l)), STATUS.triage);
  }
  const body = {};
  if (existing.title !== issue.title) body.title = issue.title;
  if ((existing.description ?? "") !== description) body.description = description;
  if (!same(existing.labels, wantLabels)) body.labels = wantLabels.join(",");
  const wantState = issue.state === "closed" ? "closed" : "opened";
  if (existing.state !== wantState) body.state_event = wantState === "closed" ? "close" : "reopen";
  if (Object.keys(body).length === 0) return "unchanged";

  await write(`update #${n}: ${Object.keys(body).join(", ")}`, () =>
    gl(`projects/${PID}/issues/${n}`, { method: "PUT", body }),
  );
  return "updated";
}

// ------------------------------------------------ comments → GitLab notes

const COMMENT_MARKER = (id) => `<!-- gh-comment ${id} -->`;

function noteBody(c) {
  const when = String(c.created_at).slice(0, 10);
  const edited = c.updated_at && c.updated_at.slice(0, 16) !== c.created_at.slice(0, 16) ? ", bearbeitet" : "";
  return [
    `**GitHub-Kommentar von [@${c.user.login}](https://github.com/${c.user.login}) am ${when}${edited}** · [auf GitHub antworten](${c.html_url})`,
    "",
    rewriteBody(c.body ?? ""),
    "",
    COMMENT_MARKER(c.id),
  ].join("\n");
}

/**
 * Copy the GitHub comments of one issue into its shadow issue as notes.
 * One way: a note is created once per comment id and updated when the comment
 * was edited; GitLab's own notes are never touched, nothing goes back.
 */
async function syncComments(issue) {
  const n = issue.number;
  if (!issue.comments) return 0; // no comments on GitHub, nothing to copy
  const [comments, notes] = await Promise.all([
    ghAll(`repos/${REPO}/issues/${n}/comments`),
    glAll(`projects/${PID}/issues/${n}/notes`),
  ]);
  const byId = new Map();
  for (const note of notes) {
    const m = /<!-- gh-comment (\d+) -->/.exec(note.body ?? "");
    if (m) byId.set(Number(m[1]), note);
  }
  let changed = 0;
  for (const c of comments) {
    const body = noteBody(c);
    const note = byId.get(c.id);
    if (!note) {
      await write(`#${n}: copy comment by @${c.user.login} (${String(c.created_at).slice(0, 10)})`, () =>
        gl(`projects/${PID}/issues/${n}/notes`, { method: "POST", body: { body } }),
      );
      changed++;
    } else if ((note.body ?? "").trim() !== body.trim()) {
      await write(`#${n}: update copied comment by @${c.user.login}`, () =>
        gl(`projects/${PID}/issues/${n}/notes/${note.id}`, { method: "PUT", body: { body } }),
      );
      changed++;
    }
  }
  return changed;
}

/** Fields + comments of one issue; returns the field result and the number of copied/updated comments. */
async function syncIssue(issue, action) {
  const result = await upsertIssue(issue, action);
  const comments = result === "skipped" || issue.pull_request ? 0 : await syncComments(issue);
  return { result, comments };
}

async function cmdIssue(number, action) {
  const issue = await gh(`repos/${REPO}/issues/${number}`);
  const { result, comments } = await syncIssue(issue, action);
  log(`#${number}: ${result}, ${comments} comments copied`);
}

async function allGhIssues(since) {
  const q = since ? `&since=${encodeURIComponent(since.toISOString())}` : "";
  const issues = await ghAll(`repos/${REPO}/issues?state=all&sort=created&direction=asc${q}`);
  return issues.filter((i) => !i.pull_request);
}

async function cmdReconcile() {
  const issues = await allGhIssues(SINCE);
  if (SINCE) log(`reconcile: issues updated since ${SINCE.toISOString()}`);
  const tally = {};
  let comments = 0;
  for (const issue of issues) {
    const s = await syncIssue(issue);
    tally[s.result] = (tally[s.result] ?? 0) + 1;
    comments += s.comments;
  }
  log(`reconcile: ${issues.length} issues`, tally, `${comments} comments copied`);
}

async function cmdBackfill() {
  const issues = await allGhIssues();
  log(`backfill: ${issues.length} GitHub issues → GitLab project ${PID}`);
  const tally = {};
  let comments = 0;
  for (const issue of issues) {
    const s = await syncIssue(issue);
    tally[s.result] = (tally[s.result] ?? 0) + 1;
    comments += s.comments;
  }
  log("backfill done", tally, `${comments} comments copied`);
}

// ------------------------------------------------------------ PR → status

/**
 * Issues a PR works on: only keyword references (`refs #123`, `fixes #123`,
 * `closes #123`, `resolves #123`, also `owner/repo#123`) and the branch name.
 * A bare `#123` in prose ("same bug as #123") is NOT a reference — it once
 * moved an unrelated issue to in-progress.
 */
function issueNumbersFromPr(pr) {
  const found = new Set();
  const text = `${pr.title}\n${pr.body ?? ""}`;
  const keyword = /\b(?:refs?|references|fix(?:es|ed)?|close[sd]?|resolve[sd]?)\s*:?\s*(?:[\w.-]+\/[\w.-]+)?#(\d+)\b/gi;
  for (const m of text.matchAll(keyword)) found.add(Number(m[1]));
  const branch = pr.head?.ref ?? "";
  const b = branch.match(/(?:^|\/)(?:issue-?)?(\d+)(?:[-_]|$)/);
  if (b) found.add(Number(b[1]));
  return [...found];
}

const currentStatus = (glIssue) => glIssue.labels.find(isStatus);

/** Transition table: which current statuses a trigger may move. */
const TRANSITIONS = {
  prOpened: {
    to: STATUS.inProgress,
    from: [STATUS.triage, STATUS.backlog, STATUS.planned, STATUS.deployToTest, STATUS.testing, STATUS.review],
    note: (pr) => `PR [#${pr.number}](${pr.html_url}) geöffnet von @${pr.user.login} → **In progress**`,
    marker: (pr) => `<!-- pr-event ${pr.number} opened -->`,
  },
  prMerged: {
    to: STATUS.deployToTest,
    from: [STATUS.triage, STATUS.backlog, STATUS.planned, STATUS.inProgress],
    note: (pr) =>
      `PR [#${pr.number}](${pr.html_url}) gemerged → **Deploy to test**. Wartet auf den nächsten Staging-Deploy; danach bitte auf Testing schieben. Zuständigkeit wurde geleert.`,
    marker: (pr) => `<!-- pr-event ${pr.number} merged -->`,
    clearAssignees: true,
  },
};

function ruleForEvent(pr, action) {
  if (["opened", "reopened", "ready_for_review"].includes(action)) return TRANSITIONS.prOpened;
  if (action === "closed" && pr.merged) return TRANSITIONS.prMerged;
  return null;
}

async function cmdPr(number, action) {
  const pr = await gh(`repos/${REPO}/pulls/${number}`);
  const rule = ruleForEvent(pr, action);
  if (!rule) return log(`pr #${number} ${action}: nothing to do`);
  await applyPrRule(pr, rule, { checkNotes: false });
}

/** Polling variant: every PR updated within SINCE; a note marker prevents re-applying. */
async function cmdPrSync() {
  const since = SINCE ?? new Date(Date.now() - 3600e3);
  const prs = await ghAll(`repos/${REPO}/pulls?state=all&sort=updated&direction=desc`);
  const recent = prs.filter((p) => new Date(p.updated_at) >= since);
  log(`pr-sync: ${recent.length} PRs updated since ${since.toISOString()}`);
  for (const pr of recent) {
    if (pr.draft) continue;
    const rule = pr.merged_at ? TRANSITIONS.prMerged : pr.state === "open" ? TRANSITIONS.prOpened : null;
    if (!rule) continue;
    await applyPrRule(pr, rule, { checkNotes: true });
  }
}

async function applyPrRule(pr, rule, { checkNotes }) {
  const number = pr.number;
  const numbers = issueNumbersFromPr(pr);
  if (numbers.length === 0) return log(`pr #${number}: no issue reference found`);

  for (const n of numbers) {
    const glIssue = await glMaybe(`projects/${PID}/issues/${n}`);
    if (!glIssue || !isMirrorOf(n, glIssue.description)) {
      log(`pr #${number}: GitLab #${n} is not a shadow issue, skipped`);
      continue;
    }
    if (checkNotes) {
      const notes = await glAll(`projects/${PID}/issues/${n}/notes`);
      if (notes.some((note) => (note.body ?? "").includes(rule.marker(pr)))) continue; // already applied
    }
    const cur = currentStatus(glIssue);
    if (cur === rule.to) continue;
    if (cur && !rule.from.includes(cur)) {
      log(`pr #${number}: #${n} is ${cur}, left alone`);
      continue;
    }
    const body = { add_labels: rule.to };
    if (rule.clearAssignees) body.assignee_ids = [];
    await write(`#${n}: ${cur ?? "no status"} → ${rule.to} (PR #${number})`, async () => {
      await gl(`projects/${PID}/issues/${n}`, { method: "PUT", body });
      await gl(`projects/${PID}/issues/${n}/notes`, {
        method: "POST",
        body: { body: `${rule.note(pr)}\n\n${rule.marker(pr)}` },
      });
    });
  }
}

// ---------------------------------------------------- status → GitHub

async function cmdStatusToGithub() {
  const [glIssues, ghIssues, ghLabels] = await Promise.all([
    glAll(`projects/${PID}/issues?state=all`),
    allGhIssues(),
    ghAll(`repos/${REPO}/labels`),
  ]);
  const ghByNumber = new Map(ghIssues.map((i) => [i.number, i]));
  const ghLabelSet = new Set(ghLabels.map((l) => l.name));
  const glLabelColor = new Map((await glLabels()).map((l) => [l.name, l.color]));
  let changed = 0;

  for (const s of glIssues) {
    if (!isMirrorOf(s.iid, s.description)) continue;
    const issue = ghByNumber.get(s.iid);
    if (!issue) continue;
    const status = currentStatus(s);
    if (!status) continue;

    const have = (issue.labels ?? []).map((l) => l.name).filter(isStatus);
    if (!(have.length === 1 && have[0] === status)) {
      if (!ghLabelSet.has(status)) {
        await write(`create GitHub label ${status}`, () =>
          gh(`repos/${REPO}/labels`, {
            method: "POST",
            body: { name: status, color: (glLabelColor.get(status) ?? "#cccccc").replace("#", "") },
          }),
        );
        ghLabelSet.add(status);
      }
      for (const old of have.filter((l) => l !== status)) {
        await write(`#${s.iid}: remove ${old}`, () =>
          gh(`repos/${REPO}/issues/${s.iid}/labels/${encodeURIComponent(old)}`, { method: "DELETE" }),
        );
      }
      await write(`#${s.iid}: add ${status}`, () =>
        gh(`repos/${REPO}/issues/${s.iid}/labels`, { method: "POST", body: { labels: [status] } }),
      );
      changed++;
    }

    if (status === STATUS.done && issue.state === "open") {
      await write(`#${s.iid}: close on GitHub (status::done)`, async () => {
        await gh(`repos/${REPO}/issues/${s.iid}/comments`, {
          method: "POST",
          body: { body: "Ausgeliefert. Das Issue wurde in der Planung auf **Done** gesetzt und ist damit erledigt." },
        });
        await gh(`repos/${REPO}/issues/${s.iid}`, {
          method: "PATCH",
          body: { state: "closed", state_reason: "completed" },
        });
      });
      changed++;
    }
  }
  log(`status-to-github: ${glIssues.length} shadow issues checked, ${changed} changes`);
  await syncProjectStatus(glIssues, ghByNumber);
}

// ------------------------------------------- status → GitHub Project field

const PROJECT_TOKEN = process.env.GH_PROJECT_TOKEN ?? "";
const PROJECT_NUMBER = Number(process.env.GH_PROJECT_NUMBER ?? 0);

/** `status::in-progress` → "In progress" (the option name in the project's Status field). */
const optionNameFor = (status) => {
  const s = status.slice("status::".length).replace(/-/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
};

async function ghGraphql(query, variables) {
  const { data } = await request("https://api.github.com/graphql", {
    method: "POST",
    headers: { authorization: `Bearer ${PROJECT_TOKEN}` },
    body: { query, variables },
  });
  if (data.errors) throw new Error(`GraphQL: ${JSON.stringify(data.errors).slice(0, 300)}`);
  return data.data;
}

/**
 * Keep the Status field of the org project in step with the status:: label.
 * Optional: runs only when GH_PROJECT_TOKEN (a token with `project` scope —
 * the Actions token cannot write org projects) and GH_PROJECT_NUMBER are set.
 * Issues missing from the project are added.
 */
async function syncProjectStatus(glIssues, ghByNumber) {
  if (!PROJECT_TOKEN || !PROJECT_NUMBER) return;
  const org = REPO.split("/")[0];

  let project;
  const items = new Map(); // "owner/repo#n" → { id, status }
  for (let after = null; ; ) {
    const d = await ghGraphql(
      `query($org:String!,$num:Int!,$after:String){ organization(login:$org){ projectV2(number:$num){
        id field(name:"Status"){ ... on ProjectV2SingleSelectField { id options{ id name } } }
        items(first:100, after:$after){ pageInfo{ hasNextPage endCursor } nodes{ id
          fieldValueByName(name:"Status"){ ... on ProjectV2ItemFieldSingleSelectValue { name } }
          content{ ... on Issue { number repository{ nameWithOwner } } } } } } } }`,
      { org, num: PROJECT_NUMBER, after },
    );
    project = d.organization.projectV2;
    for (const it of project.items.nodes) {
      if (it.content?.number) {
        items.set(`${it.content.repository.nameWithOwner}#${it.content.number}`, {
          id: it.id,
          status: it.fieldValueByName?.name ?? null,
        });
      }
    }
    if (!project.items.pageInfo.hasNextPage) break;
    after = project.items.pageInfo.endCursor;
  }
  const optionId = new Map(project.field.options.map((o) => [o.name, o.id]));

  let changed = 0;
  for (const s of glIssues) {
    if (!isMirrorOf(s.iid, s.description)) continue;
    const issue = ghByNumber.get(s.iid);
    const status = currentStatus(s);
    if (!issue || !status) continue;
    const want = optionNameFor(status);
    const wantId = optionId.get(want);
    if (!wantId) {
      console.warn(`project: no Status option "${want}" — add it to the project`);
      continue;
    }
    let item = items.get(`${REPO}#${s.iid}`);
    if (!item) {
      item = await write(`project: add #${s.iid}`, async () => {
        const d = await ghGraphql(
          `mutation($p:ID!,$c:ID!){ addProjectV2ItemById(input:{projectId:$p,contentId:$c}){ item{ id } } }`,
          { p: project.id, c: issue.node_id },
        );
        return { id: d.addProjectV2ItemById.item.id, status: null };
      });
      if (!item) continue; // dry run
    }
    if (item.status === want) continue;
    await write(`project: #${s.iid} ${item.status ?? "—"} → ${want}`, () =>
      ghGraphql(
        `mutation($p:ID!,$i:ID!,$f:ID!,$o:String!){ updateProjectV2ItemFieldValue(input:{projectId:$p,itemId:$i,fieldId:$f,value:{singleSelectOptionId:$o}}){ projectV2Item{ id } } }`,
        { p: project.id, i: item.id, f: project.field.id, o: wantId },
      ),
    );
    changed++;
  }
  log(`project #${PROJECT_NUMBER}: ${changed} status changes`);
}

// ------------------------------------------------------------- main

const [cmd, ...args] = process.argv.slice(2);
const commands = {
  issue: () => cmdIssue(Number(args[0]), args[1]),
  reconcile: cmdReconcile,
  backfill: cmdBackfill,
  pr: () => cmdPr(Number(args[0]), args[1]),
  "pr-sync": cmdPrSync,
  "status-to-github": cmdStatusToGithub,
};
if (!commands[cmd]) {
  console.error(`usage: mirror.mjs <${Object.keys(commands).join("|")}> …`);
  process.exit(2);
}
commands[cmd]().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
