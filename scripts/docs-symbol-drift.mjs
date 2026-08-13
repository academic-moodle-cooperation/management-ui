#!/usr/bin/env node
/**
 * docs-symbol-drift.mjs — docs must not name symbols the code no longer has.
 *
 * The sibling check (docs-ownership-check.mjs) asks "is this fact restated in
 * two places?". This one asks the other question: "did this change delete
 * something the docs still talk about?".
 *
 * That is the failure mode this repo keeps hitting. A field is pruned from a
 * type, an export is renamed, a hook loses its prefix — the code compiles, the
 * docs still describe the old name, and the next reader (human or agent)
 * follows an instruction that cannot work. A whole documentation audit found
 * ~120 such claims; they all entered the same way, one deletion at a time.
 *
 * How it works
 * ------------
 * 1. Diff the changed source files against the base ref.
 * 2. From REMOVED lines, collect identifiers that look like public surface:
 *    exported declarations, re-exports, and type/interface members.
 * 3. Drop every identifier the tree still defines somewhere — renames, moves
 *    and re-homings are not drift.
 * 4. Search the prose (docs/, root markdown, package and plugin READMEs) for
 *    what survives, and report file:line.
 *
 * Prose hits only count when the identifier is written as API — inside
 * backticks or as part of a dotted path. `appTitle` in a code span is a
 * reference; the word "title" in a sentence is not.
 *
 * Run locally:   pnpm docs:symbol-drift            (base: origin/develop)
 *                pnpm docs:symbol-drift r/19.x     (explicit base ref)
 * CI:            .github/workflows/docs.yml
 *
 * Zero dependencies; the file list comes from `git`, so gitignored trees
 * (.local-plugins/, dist/, node_modules/) are never scanned.
 */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const git = (...args) =>
  execFileSync("git", args, { cwd: repoRoot, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

/** Source files whose deletions can strand a doc reference. */
const SOURCE_RE = /\.(ts|tsx|js|jsx|mjs)$/;

/** Never scanned: generated output and this script's own examples. */
const SOURCE_EXCLUDE_RE = /(^|\/)(gql-generated\.ts|.*\.test\.tsx?|.*\.spec\.ts)$/;

/**
 * Prose that must stay true. Package and plugin READMEs count: they are the
 * API surface's closest documentation and drift there is just as misleading.
 */
const PROSE_RE = /(^docs\/.*\.md$|^[^/]*\.md$|^(packages|plugins|apps)\/[^/]+\/README\.md$)/;

/** Prose that documents history rather than the current tree. */
const PROSE_EXCLUDE_RE = /(^docs\/reference\/decisions\/|CHANGELOG\.md$)/;

/**
 * Type members whose names are ordinary English. A deletion of one of these
 * is reported only when the code still cannot supply it — the "still defined
 * somewhere" filter does the real work, and this list keeps the common
 * remainder quiet. Exported declarations are never stoplisted: an export
 * named `title` is API, not a word.
 */
const MEMBER_STOPLIST = new Set([
  "id",
  "key",
  "name",
  "type",
  "url",
  "path",
  "value",
  "data",
  "title",
  "label",
  "text",
  "size",
  "src",
  "href",
  "role",
  "state",
  "error",
]);

/** `export const foo`, `export function foo`, `export type Foo`, … */
const EXPORT_DECL_RE =
  /^-\s*export\s+(?:declare\s+)?(?:default\s+)?(?:async\s+)?(?:const|let|var|function|class|type|interface|enum)\s+([A-Za-z_$][\w$]*)/;

/** `export { a, b as c }` — captures the exported (outward-facing) names. */
const EXPORT_LIST_RE = /^-\s*export\s+(?:type\s+)?\{([^}]*)\}/;

/** `  foo?: string;` — a member of a type or interface. */
const MEMBER_RE = /^-\s{2,}([A-Za-z_$][\w$]*)\??\s*:/;

const baseRef = process.argv[2] ?? "origin/develop";

/** Identifiers removed from source files in this change. */
function removedIdentifiers(range) {
  const changed = git("diff", "--name-only", "--diff-filter=MD", range)
    .split("\n")
    .filter((f) => f && SOURCE_RE.test(f) && !SOURCE_EXCLUDE_RE.test(f));
  if (changed.length === 0) return new Map();

  const found = new Map(); // identifier -> Set(source files it left)
  for (const file of changed) {
    const diff = git("diff", "-U0", range, "--", file);
    for (const line of diff.split("\n")) {
      if (!line.startsWith("-") || line.startsWith("---")) continue;

      const decl = EXPORT_DECL_RE.exec(line);
      if (decl) {
        add(found, decl[1], file, "export");
        continue;
      }

      const list = EXPORT_LIST_RE.exec(line);
      if (list) {
        for (const part of list[1].split(",")) {
          // `a as b` exports b; a bare `a` exports a.
          const name = part.includes(" as ") ? part.split(" as ")[1] : part;
          const id = name.trim().replace(/^type\s+/, "");
          if (/^[A-Za-z_$][\w$]*$/.test(id)) add(found, id, file, "export");
        }
        continue;
      }

      const member = MEMBER_RE.exec(line);
      if (member && !MEMBER_STOPLIST.has(member[1])) add(found, member[1], file, "member");
    }
  }
  return found;
}

function add(map, id, file, kind) {
  if (id.length < 4) return;
  const entry = map.get(id) ?? { files: new Set(), kind };
  entry.files.add(file);
  map.set(id, entry);
}

/**
 * `git grep` runs POSIX ERE, where `\b` matches nothing at all — silently, so
 * a pattern that uses it reports a clean tree forever. (`-P` would work but is
 * absent from git builds without PCRE.) So git grep only pre-filters on the
 * bare identifier, and every precise decision is made below in JavaScript,
 * whose regex engine does support word boundaries.
 */
function grepFixed(id, patterns) {
  try {
    return git("grep", "-n", "-F", id, "--", ...patterns).split("\n").filter(Boolean);
  } catch {
    return []; // git grep exits 1 when nothing matches
  }
}

/** True when the tree still *defines* the identifier — a rename or move, not drift. */
function stillDefined(id) {
  // Must match a *declaration*, not a use. `export const cfg = id({…})` starts
  // with `export` and contains the name, but declares `cfg` — treating that as
  // "still defined" would let every removal of a widely-called helper pass.
  // Anchoring also keeps ` * export const x = id(…)` in a JSDoc example out.
  const declares = new RegExp(
    [
      `^\\s*export\\s+(?:declare\\s+)?(?:default\\s+)?(?:async\\s+)?` +
        `(?:const|let|var|function|class|type|interface|enum)\\s+${id}\\b`,
      `^\\s*export\\s+(?:type\\s+)?\\{[^}]*\\b${id}\\b[^}]*\\}`,
      `^\\s*(?:readonly\\s+)?${id}\\??\\s*[:(<]`,
    ].join("|"),
    "m",
  );
  const files = new Set(
    grepFixed(id, [
      "*.ts",
      "*.tsx",
      "*.js",
      "*.mjs",
      ":!**/dist/**",
      ":!**/dist-types/**",
    ]).map((line) => line.split(":")[0]),
  );
  for (const file of files) {
    try {
      if (declares.test(readFileSync(resolve(repoRoot, file), "utf8"))) return true;
    } catch {
      /* file vanished between grep and read — treat as not defining */
    }
  }
  return false;
}

/**
 * A line that *documents* a removal legitimately names the removed symbol —
 * "Removed `app.appTitle`", "no longer exported", a deprecation note. Those
 * are the docs doing their job, not drift, so they do not count. (Verified
 * against the real 2026-05-28 AppConfig prune, whose notes this skips.)
 */
const REMOVAL_CONTEXT_RE =
  /\b(remove[ds]?|removal|prune[ds]?|drop(ped|s)?|delete[ds]?|deprecat\w*|no longer|used to|formerly|until|superseded|renamed|replaced)\b/i;

/** Opt-out for a mention the heuristic cannot recognise: `<!-- symbol-drift-ok -->`. */
const OPT_OUT_RE = /<!--\s*symbol-drift-ok\b/;

const fileCache = new Map();
function lines(file) {
  if (!fileCache.has(file)) {
    try {
      fileCache.set(file, readFileSync(resolve(repoRoot, file), "utf8").split("\n"));
    } catch {
      fileCache.set(file, []);
    }
  }
  return fileCache.get(file);
}

/**
 * Removal notes wrap. The keyword sits on the first line of the note and the
 * symbol two lines down, so the exemption is judged over a small window ending
 * at the hit rather than the hit line alone.
 */
const CONTEXT_LINES = 3;

function inRemovalContext(file, lineNo) {
  const all = lines(file);
  const end = Number(lineNo); // 1-based, inclusive
  const window = all.slice(Math.max(0, end - 1 - CONTEXT_LINES), end).join(" ");
  return REMOVAL_CONTEXT_RE.test(window) || OPT_OUT_RE.test(window);
}

/** Prose references written as API: `foo` inside a code span, or a dotted `a.b.foo`. */
function proseReferences(id) {
  const asApi = new RegExp(`(\`[^\`\\n]*\\b${id}\\b[^\`\\n]*\`|\\.${id}\\b)`);
  return grepFixed(id, ["*.md"])
    .map((line) => {
      const [file, lineNo, ...rest] = line.split(":");
      return { file, line: lineNo, text: rest.join(":").trim() };
    })
    .filter(
      ({ file, line, text }) =>
        PROSE_RE.test(file) &&
        !PROSE_EXCLUDE_RE.test(file) &&
        asApi.test(text) &&
        !inRemovalContext(file, line),
    );
}

const range = `${baseRef}...HEAD`;
const removed = removedIdentifiers(range);

const findings = [];
for (const [id, { kind }] of removed) {
  if (stillDefined(id)) continue;
  const refs = proseReferences(id);
  if (refs.length > 0) findings.push({ id, kind, refs });
}

if (findings.length === 0) {
  const scanned = removed.size;
  console.log(
    `docs-symbol-drift: OK — ${scanned} removed identifier(s) checked against the prose, none left stranded.`,
  );
  process.exit(0);
}

console.error("docs-symbol-drift: documentation still names symbols this change removed.\n");
for (const { id, kind, refs } of findings) {
  console.error(`  ${id}  (${kind} — no longer defined anywhere in the tree)`);
  for (const ref of refs.slice(0, 8)) {
    console.error(`    ${ref.file}:${ref.line}  ${ref.text.slice(0, 100)}`);
  }
  if (refs.length > 8) console.error(`    … and ${refs.length - 8} more`);
  console.error("");
}
console.error(
  "Update or remove those references in this PR (AGENTS.md pre-flight: docs stay in sync).\n" +
    "If a reference is deliberately historical, move it under docs/reference/decisions/.",
);
process.exit(1);
