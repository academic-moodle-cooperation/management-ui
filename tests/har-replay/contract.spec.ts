import { expect, test } from "@playwright/test";

import { graphqlExchanges, listRecordings, readEntries } from "./_recordings";

/**
 * Static analysis of a tester's recording — no browser needed. This is
 * test-protocol.md §4 (GraphQL data flow) turned into a check that runs in CI
 * against real production traffic, without CI ever reaching the backend:
 * whatever the tester's session actually did, we assert on the payloads.
 *
 * A failure here is a real backend/contract regression that a mocked suite
 * cannot see — a schema drift, an operation that lost its `Mui` prefix, a
 * silent GraphQL `errors` array behind a UI that still rendered.
 */

const recordings = listRecordings();

test.describe("HAR contract checks", () => {
  // A declared-but-skipped test rather than a describe-level skip: with an empty
  // recordings dir the loop below produces nothing, and Playwright treats "no
  // tests found" as a run failure. This keeps `pnpm test:har-replay` green in a
  // clone that has no recordings.
  if (recordings.length === 0) {
    test.skip("no recordings in tests/har-replay/recordings/ — see docs/operations/manual-test-recording.md", () => {});
  }

  for (const recording of recordings) {
    test.describe(recording.name, () => {
      test("§4 every GraphQL operation carries the Mui prefix", () => {
        const exchanges = graphqlExchanges(readEntries(recording.path));
        expect(exchanges.length, "recording contains no GraphQL traffic").toBeGreaterThan(0);
        const offenders = exchanges
          .map((e) => e.operationName)
          .filter((name) => !name.startsWith("Mui"));
        expect(
          [...new Set(offenders)],
          "operations must be Mui-prefixed (docs/architecture/CONTRACTS.md)",
        ).toEqual([]);
      });

      test("§4 no GraphQL response carries an errors array", () => {
        const exchanges = graphqlExchanges(readEntries(recording.path));
        const failed = exchanges
          .filter((e) => Array.isArray(e.response?.errors) && e.response.errors.length > 0)
          .map((e) => `${e.operationName}: ${JSON.stringify(e.response?.errors).slice(0, 300)}`);
        expect(failed, "GraphQL errors recorded during the manual run").toEqual([]);
      });

      test("no request returned a server error", () => {
        const entries = readEntries(recording.path);
        const failed = entries
          .filter((e) => e.response.status >= 500)
          .map((e) => `${e.response.status} ${e.request.method} ${e.request.url}`);
        expect(failed).toEqual([]);
      });

      test("recording was sanitized (no auth headers or cookies survived)", () => {
        const entries = readEntries(recording.path);
        const leaks: string[] = [];
        for (const entry of entries) {
          for (const header of [...entry.request.headers, ...entry.response.headers]) {
            if (/^(cookie|set-cookie|authorization)$/i.test(header.name)) {
              leaks.push(`${header.name} on ${entry.request.url}`);
            }
          }
        }
        expect(
          leaks,
          "run scripts/sanitize-har.mjs before adding a recording — raw HARs are credentials",
        ).toEqual([]);
      });
    });
  }
});
