# Manual protocol — import and coverage

The org's manual test protocol lives in a wiki table. This directory turns it
into something a machine can reconcile against the automated suites, so the
protocol **shrinks** every release instead of accumulating.

The wiki page stays the source of truth for humans. Nothing here writes back to
it.

## Why the IDs matter

The wiki table has a `Nr.` column that was never filled in — the rows are
unnumbered. That single gap is why the protocol can't shrink: you cannot
say "row 42 is automated now", so nobody ever removes a row, and the findings
list ends up as a second, unlinked numbering scheme beside it.

`protocol-import.mjs` assigns a permanent id per row, grouped by area:

| Prefix | Area |
|---|---|
| `GEN` | Allgemein / Navigation |
| `SER` | Serien |
| `VID` | Videos |
| `UPL` | Upload |
| `STU` | Studio (out of MUI scope) |
| `CAP` | Capture-UI (out of MUI scope) |

Ids are **permanent**. A re-import of an edited wiki page carries forward the id
of any row whose area, action and expectation still match; only genuinely new
rows get new numbers. Retire numbers, never reuse them.

## Workflow

**1. Export the wiki tables.** Open the page, open the browser console, paste:

```js
function grid(t){const g=[];for(let r=0;r<t.rows.length;r++){g[r]=g[r]||[];let c=0;
for(const cell of t.rows[r].cells){while(g[r][c]!==undefined)c++;
const txt=cell.innerText.replace(/ /g,' ').replace(/[ \t]+/g,' ').replace(/\n{2,}/g,'\n').trim();
for(let dr=0;dr<(cell.rowSpan||1);dr++){for(let dc=0;dc<(cell.colSpan||1);dc++){
g[r+dr]=g[r+dr]||[];g[r+dr][c+dc]=(dr===0&&dc===0)?txt:'';}}c+=cell.colSpan||1;}}return g;}
const T=[...document.querySelectorAll('#main-content table')];
const payload={source:location.href,title:document.title,
  matrix:grid(T[0]),findings:grid(T[1]),questions:grid(T[2]),notes:grid(T[3])};
const a=document.createElement('a');
a.href=URL.createObjectURL(new Blob([JSON.stringify(payload,null,1)],{type:'application/json'}));
a.download='mui-protokoll-raw.json';document.body.appendChild(a);a.click();a.remove();
```

It reads the **rendered** table (not the storage format), normalises merged
cells into a grid, and downloads the JSON.

**2. Import.**

```bash
pnpm protocol:import ~/Downloads/mui-protokoll-raw.json -o tests/protocol/<org>.yaml
```

The importer's row matchers (area detection, verdict parsing) are tailored to
the source wiki's German column labels and action phrasing — see the matcher
table at the top of `scripts/protocol-import.mjs` and adjust it if your wiki
uses different wording.

The import prints how many results each browser column actually contains —
a browser column that is empty across the whole matrix is a column the matrix
only pretends to cover.

**3. Check coverage.**

```bash
pnpm protocol:coverage tests/protocol/<org>.yaml
pnpm protocol:coverage tests/protocol/<org>.yaml --md > coverage.md
```

## How a test claims a step

Put the id in the test title. That is the entire protocol:

```ts
test("[SER-04] search spans every page of results", async ({ page }) => { … });
```

The coverage script scans the test tree for `[XXX-NN]` markers, so there is no
second registry to keep in sync — and `--strict` fails when a test claims an id
the protocol doesn't have (a typo, or a step deleted upstream). That's the check
to wire into CI once coverage starts growing.

`automatedBy:` in the YAML is a manual escape hatch for coverage that can't carry
a marker (a contract test, a lint rule). Prefer the title marker.

## What the import gives you

- **Every step with a stable id**, split into MUI scope and out-of-scope areas
  (Studio and Capture-UI are separate products and should not be counted as
  MUI failures).
- **Findings with their issue links**, cross-referenced from the steps that
  produced them.
- **Steps that already failed at least once**, sorted to the top of the
  coverage report: the protocol has effectively pre-sorted the automation
  backlog by "things that actually break".

## Not committed

`*.yaml` and `*.raw.json` here are gitignored. The protocol content is the org's,
not the OSS project's — same split as
[`tests/har-replay/`](../har-replay/README.md) and
[`tests/org-plugin/`](../org-plugin/README.md): tracked machinery, untracked org
data. Keep the YAML wherever that org keeps its test artifacts.

## Known limitations

- **One page, many runs.** Wiki cells accumulate history across runs; the import
  records this as `lastKnown` — treat a cell as *a* result, not *the current*
  result.
- The reader in `protocol-coverage.mjs` understands only the shape the importer
  emits — it is not a general YAML parser. Change both together.
