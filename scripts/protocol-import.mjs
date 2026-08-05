#!/usr/bin/env node
/**
 * Turn an exported Confluence test-protocol table into a structured YAML with
 * stable step IDs.
 *
 * The manual protocol lives in a wiki table whose "Nr." column was never filled
 * in. Without an ID per row you cannot say "this step is now covered by a test",
 * so the protocol can never shrink — it only accumulates. This script assigns
 * the IDs once and emits a machine-readable form that
 * `scripts/protocol-coverage.mjs` can diff against the automated suites.
 *
 * Input is the JSON produced by the browser snippet in
 * tests/protocol/README.md (a grid-normalised dump of the wiki tables).
 *
 * Usage:
 *   node scripts/protocol-import.mjs raw.json -o tests/protocol/univie.yaml
 *   node scripts/protocol-import.mjs raw.json --md          # printable checklist
 *
 * IDs are assigned per area in document order and are meant to be **permanent**:
 * once emitted, keep them. A re-import of an edited wiki page reuses the ID of
 * any row whose area, action and expectation still match (see --previous);
 * only genuinely new rows get new numbers.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";

/** Column indices in the exported matrix. */
const COL = {
  nr: 0,
  action: 1,
  followUp: 2,
  expectation: 3,
  results: [4, 5, 6, 7, 8, 9],
  findingRefs: 10,
  note: 11,
};

const BROWSERS = [
  { key: "chrome", label: "Chrome/Edge" },
  { key: "firefox", label: "Firefox" },
  { key: "safari", label: "Safari" },
  { key: "android-firefox", label: "Android (Tablet) Firefox" },
  { key: "android-chrome", label: "Android (Tablet) Chrome" },
  { key: "ios-safari", label: "iOS (Tablet) Safari" },
];

/**
 * A new area starts where the protocol navigates into a section. Matched on the
 * exact action text so "Klick auf Serien, im linken Menü" (a return trip in the
 * middle of the series block) doesn't open a second Series area.
 */
const AREA_ANCHORS = [
  { match: "Klick auf Serien", prefix: "SER", area: "Serien", scope: "mui" },
  { match: "Klick auf Videos", prefix: "VID", area: "Videos", scope: "mui" },
  { match: "Klick auf Upload", prefix: "UPL", area: "Upload", scope: "mui" },
  { match: "Klick auf Studio", prefix: "STU", area: "Studio", scope: "studio" },
  {
    match: "Klick auf Serie anmelden & Streaming",
    prefix: "CAP",
    area: "Capture-UI",
    scope: "capture-ui",
  },
];

const DEFAULT_AREA = { prefix: "GEN", area: "Allgemein / Navigation", scope: "mui" };

const clean = (value) =>
  String(value ?? "")
    // Confluence is full of non-breaking spaces; matched via an escape so the
    // source stays readable and lint-clean.
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, " ⏎ ")
    .trim();

/**
 * Split a result cell into a verdict and whatever the tester wrote around it.
 * Cells look like `OK`, `NOK`, `NOK*)10.1.2026`, or a bare comment.
 */
function parseResult(raw) {
  const text = clean(raw);
  if (!text) return { status: null, note: "" };
  const match = /^(NOK|OK)\s*(.*)$/is.exec(text);
  // Cells that are pure prose ("nicht genug Serien vorhanden") carry no verdict.
  if (!match) return { status: "unclear", note: text };
  return { status: match[1].toUpperCase(), note: clean(match[2]) };
}

/** `"014, 018 020"` → `["014", "018", "020"]` */
function parseFindingRefs(raw) {
  return [...clean(raw).matchAll(/\b(\d{3})\b/g)].map((m) => m[1]);
}

function importMatrix(matrix, previous) {
  // Row 0 is the header; Confluence repeats it in row 1 of the body.
  const body = matrix.slice(1).filter((row) => clean(row[COL.action]) !== "Aktion");

  const steps = [];
  const used = new Set();
  let area = DEFAULT_AREA;
  let counter = 0;
  let currentAction = "";

  for (const row of body) {
    const action = clean(row[COL.action]);
    const followUp = clean(row[COL.followUp]);
    const expectation = clean(row[COL.expectation]);

    // Spacer rows between sections carry nothing at all.
    if (!action && !followUp && !expectation) continue;

    const anchor = AREA_ANCHORS.find((a) => a.match === action);
    if (anchor) {
      area = anchor;
      counter = 0;
    }
    if (action) currentAction = action;

    const key = stepKey({ area: area.area, action: currentAction, followUp, expectation });
    const carried = previous.get(key);
    let id = carried && !used.has(carried) ? carried : null;
    while (!id) {
      counter += 1;
      const candidate = `${area.prefix}-${String(counter).padStart(2, "0")}`;
      if (!used.has(candidate)) id = candidate;
    }
    used.add(id);

    steps.push({
      id,
      area: area.area,
      scope: area.scope,
      action: currentAction,
      followUp,
      expectation,
      // Filled in by hand or by scripts/protocol-coverage.mjs.
      automatedBy: null,
      findings: parseFindingRefs(row[COL.findingRefs]),
      note: clean(row[COL.note]),
      lastKnown: Object.fromEntries(
        BROWSERS.map((browser, i) => [browser.key, parseResult(row[COL.results[i]])]),
      ),
    });
  }
  return steps;
}

function importFindings(rows) {
  return rows
    .slice(1)
    .map((row) => ({
      id: clean(row[0]),
      description: clean(row[1]),
      issue: clean(row[2]),
      note: clean(row[3]),
    }))
    .filter((f) => /^\d{3}$/.test(f.id));
}

// ── YAML emitter ────────────────────────────────────────────────────────────
// Hand-rolled rather than pulling in a dependency: the shape is fixed and small,
// and this keeps the script runnable from a bare checkout.

const quote = (s) => `"${String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

/**
 * Allow-list, not deny-list. Free-text protocol prose is full of `:`, `#`, `"`
 * and `→`, and every deny-list attempt here leaked something (a trailing
 * `Google Chrome:` produced an implicit-key parse error). Emit plain scalars
 * only for the boring cases and quote everything else.
 */
const isPlainSafe = (s) =>
  /^[A-Za-z0-9][A-Za-z0-9 _./-]*$/.test(s) &&
  !/^(true|false|null|yes|no|on|off|\d+(\.\d+)?)$/i.test(s);

const yamlString = (value) => {
  const s = String(value);
  return isPlainSafe(s) ? s : quote(s);
};

/**
 * Inside a `{ … }` flow map, `,` and `}` terminate the scalar — rules that don't
 * apply in block context. Always quote rather than trying to enumerate them.
 */
const yamlFlowString = (value) => quote(value);

function emitYaml(doc) {
  const out = [
    "# Generated by scripts/protocol-import.mjs — re-run the import instead of",
    "# hand-editing. `id` values are permanent: never renumber them.",
    "#",
    "# automatedBy: set to the spec that covers a step, or leave null. A test",
    "# claims a step by putting its id in the test title, e.g.",
    '#   test("[SER-04] search spans every page of results", …)',
    "# scripts/protocol-coverage.mjs reconciles the two.",
    "",
    `source: ${yamlString(doc.source)}`,
    `sourceTitle: ${yamlString(doc.sourceTitle)}`,
    `imported: ${yamlString(doc.imported)}`,
    "browsers:",
    ...BROWSERS.map((b) => `  - key: ${b.key}\n    label: ${yamlString(b.label)}`),
    "",
    "steps:",
  ];

  for (const step of doc.steps) {
    out.push(`  - id: ${step.id}`);
    out.push(`    area: ${yamlString(step.area)}`);
    out.push(`    scope: ${step.scope}`);
    out.push(`    action: ${yamlString(step.action)}`);
    if (step.followUp) out.push(`    followUp: ${yamlString(step.followUp)}`);
    out.push(`    expectation: ${yamlString(step.expectation)}`);
    out.push(`    automatedBy: ${step.automatedBy ? yamlString(step.automatedBy) : "null"}`);
    out.push(
      step.findings.length
        ? `    findings: [${step.findings.map((f) => `"${f}"`).join(", ")}]`
        : "    findings: []",
    );
    if (step.note) out.push(`    note: ${yamlString(step.note)}`);
    const known = Object.entries(step.lastKnown).filter(([, r]) => r.status || r.note);
    if (known.length) {
      out.push("    lastKnown:");
      for (const [key, result] of known) {
        const parts = [`status: ${result.status ?? "null"}`];
        if (result.note) parts.push(`note: ${yamlFlowString(result.note)}`);
        out.push(`      ${key}: { ${parts.join(", ")} }`);
      }
    }
    out.push("");
  }

  out.push("findings:");
  for (const finding of doc.findings) {
    out.push(`  - id: ${yamlString(finding.id)}`);
    out.push(`    description: ${yamlString(finding.description)}`);
    if (finding.issue) out.push(`    issue: ${yamlString(finding.issue)}`);
    if (finding.note) out.push(`    note: ${yamlString(finding.note)}`);
  }
  return out.join("\n") + "\n";
}

function emitMarkdown(doc) {
  const out = [`# ${doc.sourceTitle}`, "", `Imported ${doc.imported} from ${doc.source}`, ""];
  let area = null;
  for (const step of doc.steps) {
    if (step.area !== area) {
      area = step.area;
      out.push("", `## ${area}`, "", "| ID | Aktion | Erwartung | Fehler |", "|---|---|---|---|");
    }
    const action = [step.action, step.followUp].filter(Boolean).join(" → ");
    out.push(
      `| \`${step.id}\` | ${action.replace(/\|/g, "\\|")} | ${step.expectation.replace(/\|/g, "\\|")} | ${step.findings.join(", ")} |`,
    );
  }
  return out.join("\n") + "\n";
}

/**
 * Identity of a step across re-imports. The expectation text alone is NOT
 * unique — "Optisch einwandfreie Darstellung der Seite" appears once per area —
 * so the area and the action have to be part of the key.
 */
const stepKey = (step) =>
  [step.area ?? "", step.action ?? "", step.followUp ?? "", step.expectation ?? ""].join("|");

const unquote = (value) =>
  value
    .trim()
    .replace(/^"([\s\S]*)"$/, "$1")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");

/** Reuse IDs from a previous export so a re-import doesn't renumber anything. */
function readPreviousIds(path) {
  const map = new Map();
  if (!path || !existsSync(path)) return map;

  let current = null;
  const flush = () => {
    // Entries under `findings:` share the `- id:` shape but have no expectation.
    if (current?.id && current.expectation !== undefined) map.set(stepKey(current), current.id);
    current = null;
  };

  for (const line of readFileSync(path, "utf-8").split("\n")) {
    const start = /^ {2}- id: (.*)$/.exec(line);
    if (start) {
      flush();
      current = { id: unquote(start[1]) };
      continue;
    }
    if (!current) continue;
    const field = /^ {4}(area|action|followUp|expectation): (.*)$/.exec(line);
    if (field) current[field[1]] = unquote(field[2]);
  }
  flush();
  return map;
}

function main() {
  const argv = process.argv.slice(2);
  const input = argv.find((a) => !a.startsWith("-"));
  const outIndex = Math.max(argv.indexOf("-o"), argv.indexOf("--out"));
  const out = outIndex >= 0 ? argv[outIndex + 1] : null;
  const prevIndex = argv.indexOf("--previous");
  const asMarkdown = argv.includes("--md");

  if (!input) {
    console.error(
      "usage: node scripts/protocol-import.mjs <raw.json> [-o out.yaml] [--md] [--previous old.yaml]\n" +
        "       the raw.json export snippet lives in tests/protocol/README.md",
    );
    process.exit(1);
  }

  const raw = JSON.parse(readFileSync(input, "utf-8"));
  const previous = readPreviousIds(prevIndex >= 0 ? argv[prevIndex + 1] : out);

  const doc = {
    source: raw.source ?? "",
    sourceTitle: raw.title ?? "Test protocol",
    imported: new Date().toISOString().slice(0, 10),
    steps: importMatrix(raw.matrix ?? [], previous),
    findings: importFindings(raw.findings ?? []),
  };

  const rendered = asMarkdown ? emitMarkdown(doc) : emitYaml(doc);
  if (out) {
    writeFileSync(out, rendered, "utf-8");
    const byArea = new Map();
    for (const step of doc.steps) byArea.set(step.area, (byArea.get(step.area) ?? 0) + 1);
    console.log(`✓ ${doc.steps.length} steps, ${doc.findings.length} findings → ${out}`);
    for (const [area, count] of byArea) console.log(`    ${String(count).padStart(3)}  ${area}`);

    // Surface columns nobody filled in: a browser column that is empty across
    // the whole matrix is a column the matrix only pretends to cover.
    console.log("\n  results recorded per browser:");
    for (const browser of BROWSERS) {
      const filled = doc.steps.filter((s) => s.lastKnown[browser.key]?.status).length;
      const flag = filled === 0 ? "  ← never filled in" : "";
      console.log(
        `    ${browser.label.padEnd(26)} ${String(filled).padStart(3)}/${doc.steps.length}${flag}`,
      );
    }
  } else {
    process.stdout.write(rendered);
  }
}

main();
