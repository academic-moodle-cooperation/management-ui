#!/usr/bin/env node
/**
 * Reconcile the manual test protocol against the automated suites.
 *
 * A test claims a protocol step by naming its id in the title:
 *
 *   test("[SER-04] search spans every page of results", async ({ page }) => { … });
 *
 * This script reads the imported protocol YAML, scans the test tree for those
 * markers, and reports what is still hand-run. That number is the whole point:
 * it is the only honest measure of whether manual testing is shrinking.
 *
 * Usage:
 *   node scripts/protocol-coverage.mjs tests/protocol/univie.yaml
 *   node scripts/protocol-coverage.mjs tests/protocol/univie.yaml --scan tests,plugins
 *   node scripts/protocol-coverage.mjs tests/protocol/univie.yaml --md > coverage.md
 *   node scripts/protocol-coverage.mjs tests/protocol/univie.yaml --strict   # CI: fail on unknown ids
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ID_RE = /\[([A-Z]{3}-\d{2,})\]/g;
const SCANNABLE = /\.(ts|tsx|js|mjs|spec\.ts)$/;
const SKIP_DIRS = new Set(["node_modules", "dist", "dist-types", ".turbo", "target", "coverage"]);

/**
 * Minimal reader for the shape `scripts/protocol-import.mjs` emits — not a
 * general YAML parser. Keeping it here avoids a runtime dependency for what is
 * a fixed, generated format; if the emitter changes, change this too.
 */
function readProtocol(path) {
  const unquote = (value) =>
    value
      .trim()
      .replace(/^"([\s\S]*)"$/, "$1")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");

  const steps = [];
  let current = null;
  let inLastKnown = false;

  for (const line of readFileSync(path, "utf-8").split("\n")) {
    const start = /^ {2}- id: (.*)$/.exec(line);
    if (start) {
      if (current?.expectation !== undefined) steps.push(current);
      current = { id: unquote(start[1]), findings: [], lastKnown: {} };
      inLastKnown = false;
      continue;
    }
    if (!current) continue;

    if (/^ {4}lastKnown:/.test(line)) {
      inLastKnown = true;
      continue;
    }
    if (inLastKnown) {
      const result = /^ {6}([\w-]+): \{ status: ([^,}]+)/.exec(line);
      if (result) {
        current.lastKnown[result[1]] = result[2].trim();
        continue;
      }
      inLastKnown = false;
    }

    const findings = /^ {4}findings: \[(.*)\]$/.exec(line);
    if (findings) {
      current.findings = [...findings[1].matchAll(/"(\d+)"/g)].map((m) => m[1]);
      continue;
    }
    const field = /^ {4}(area|scope|action|followUp|expectation|automatedBy): (.*)$/.exec(line);
    if (field) current[field[1]] = field[2].trim() === "null" ? null : unquote(field[2]);
  }
  if (current?.expectation !== undefined) steps.push(current);
  return steps;
}

/** Walk a directory tree collecting `[ID]` markers → the files that claim them. */
function scanForIds(roots) {
  const claims = new Map();
  const visit = (path) => {
    let stats;
    try {
      stats = statSync(path);
    } catch {
      return;
    }
    if (stats.isDirectory()) {
      const name = path.split("/").pop();
      if (SKIP_DIRS.has(name) || name.startsWith(".")) return;
      for (const entry of readdirSync(path)) visit(join(path, entry));
      return;
    }
    if (!SCANNABLE.test(path)) return;
    const text = readFileSync(path, "utf-8");
    for (const match of text.matchAll(ID_RE)) {
      if (!claims.has(match[1])) claims.set(match[1], new Set());
      claims.get(match[1]).add(path);
    }
  };
  for (const root of roots) if (existsSync(root)) visit(root);
  return claims;
}

const failedBefore = (step) => Object.values(step.lastKnown).some((s) => s === "NOK");

function main() {
  const argv = process.argv.slice(2);
  const protocolPath = argv.find((a) => !a.startsWith("-"));
  const scanIndex = argv.indexOf("--scan");
  const roots = (scanIndex >= 0 ? argv[scanIndex + 1] : "tests").split(",");
  const asMarkdown = argv.includes("--md");
  const strict = argv.includes("--strict");

  if (!protocolPath || !existsSync(protocolPath)) {
    console.error(
      "usage: node scripts/protocol-coverage.mjs <protocol.yaml> [--scan dirs] [--md] [--strict]",
    );
    process.exit(1);
  }

  const steps = readProtocol(protocolPath);
  const claims = scanForIds(roots);
  const known = new Set(steps.map((s) => s.id));

  for (const step of steps) {
    step.coveredBy = [...(claims.get(step.id) ?? [])];
    if (!step.coveredBy.length && step.automatedBy) step.coveredBy = [step.automatedBy];
  }

  const inScope = steps.filter((s) => s.scope === "mui");
  const outOfScope = steps.filter((s) => s.scope !== "mui");
  const covered = inScope.filter((s) => s.coveredBy.length);
  const uncovered = inScope.filter((s) => !s.coveredBy.length);
  const unknown = [...claims.keys()].filter((id) => !known.has(id));

  // Steps that already broke once are the ones worth automating first — the
  // protocol has effectively pre-sorted the backlog for us.
  const priority = uncovered
    .filter((s) => failedBefore(s) || s.findings.length)
    .sort((a, b) => b.findings.length - a.findings.length);

  const byArea = new Map();
  for (const step of inScope) {
    const entry = byArea.get(step.area) ?? { total: 0, covered: 0 };
    entry.total += 1;
    if (step.coveredBy.length) entry.covered += 1;
    byArea.set(step.area, entry);
  }

  const pct = (n, total) => (total ? Math.round((n / total) * 100) : 0);
  const out = [];

  if (asMarkdown) {
    out.push(`# Protocol coverage`, "", `Source: \`${protocolPath}\``, "");
    out.push(
      `**${covered.length} of ${inScope.length}** in-scope steps are automated (${pct(covered.length, inScope.length)}%).`,
      "",
      "| Area | Automated | Manual |",
      "|---|---:|---:|",
    );
    for (const [area, e] of byArea) out.push(`| ${area} | ${e.covered} | ${e.total - e.covered} |`);
    out.push("", "## Automate next (already failed at least once)", "");
    out.push("| ID | Action | Expectation | Findings |", "|---|---|---|---|");
    for (const s of priority) {
      out.push(
        `| \`${s.id}\` | ${[s.action, s.followUp].filter(Boolean).join(" → ")} | ${s.expectation} | ${s.findings.join(", ")} |`,
      );
    }
  } else {
    out.push("", `Protocol coverage — ${protocolPath}`, "");
    out.push(
      `  in scope (mui)   ${String(inScope.length).padStart(3)}`,
      `  automated        ${String(covered.length).padStart(3)}  (${pct(covered.length, inScope.length)}%)`,
      `  still manual     ${String(uncovered.length).padStart(3)}`,
      `  out of scope     ${String(outOfScope.length).padStart(3)}  (${outOfScope.map((s) => s.scope).join(", ") || "—"})`,
      "",
      "  by area:",
    );
    for (const [area, e] of byArea) {
      out.push(
        `    ${area.padEnd(26)} ${String(e.covered).padStart(3)}/${String(e.total).padEnd(3)}`,
      );
    }
    if (priority.length) {
      out.push("", `  automate next — ${priority.length} step(s) that already failed:`);
      for (const s of priority.slice(0, 15)) {
        const refs = s.findings.length ? ` [${s.findings.join(",")}]` : "";
        // The expectation is what distinguishes sub-steps: several rows share
        // one action ("Klick auf die 4 Quadrate") and differ only in what they
        // assert, so printing the action alone reads as duplicates.
        const what = [s.action, s.followUp].filter(Boolean).join(" → ");
        out.push(`    ${s.id}  ${what}${refs}`);
        out.push(`            ↳ ${s.expectation.slice(0, 76)}`);
      }
      if (priority.length > 15) out.push(`    … and ${priority.length - 15} more`);
    }
    if (unknown.length) {
      out.push("", `  ⚠ ids claimed by tests but absent from the protocol: ${unknown.join(", ")}`);
    }
    out.push("");
  }

  console.log(out.join("\n"));
  if (strict && unknown.length) process.exit(1);
}

main();
