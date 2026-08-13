import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

/**
 * Where sanitized tester recordings live. Gitignored: a HAR captured against a
 * real deployment is org-specific data, so the machinery is tracked and the
 * recordings are not. See docs/contribute/manual-test-recording.md.
 */
export const RECORDINGS_DIR = resolve("tests/har-replay/recordings");

export interface Recording {
  /** File name without extension — used as the test title. */
  name: string;
  /** Absolute path, for page.routeFromHAR(). */
  path: string;
}

export function listRecordings(): Recording[] {
  if (!existsSync(RECORDINGS_DIR)) return [];
  return readdirSync(RECORDINGS_DIR)
    .filter((file) => file.endsWith(".har"))
    .sort()
    .map((file) => ({ name: file.replace(/\.har$/, ""), path: join(RECORDINGS_DIR, file) }));
}

export interface HarEntry {
  request: {
    method: string;
    url: string;
    headers: Array<{ name: string; value: string }>;
    postData?: { text?: string };
  };
  response: {
    status: number;
    headers: Array<{ name: string; value: string }>;
    content?: { mimeType?: string; text?: string };
  };
}

export function readEntries(path: string): HarEntry[] {
  const har = JSON.parse(readFileSync(path, "utf-8")) as { log?: { entries?: HarEntry[] } };
  return har.log?.entries ?? [];
}

const OP_RE = /\b(query|mutation|subscription)\s+(\w+)/;

export interface GraphqlExchange {
  operationName: string;
  operationType: string;
  /** Parsed response body, or null when it wasn't JSON. */
  response: { data?: unknown; errors?: unknown[] } | null;
}

/**
 * Pull the GraphQL traffic out of a recording. Same parsing rules as the live
 * recorder in tests/integration/graphql-recorder.ts — operation name comes from
 * the request body, never the URL (every operation POSTs to the same /graphql).
 */
export function graphqlExchanges(entries: HarEntry[]): GraphqlExchange[] {
  const out: GraphqlExchange[] = [];
  for (const entry of entries) {
    if (entry.request.method !== "POST") continue;
    if (!entry.request.url.includes("/graphql")) continue;
    let operationName = "(anonymous)";
    let operationType = "query";
    try {
      const body = JSON.parse(entry.request.postData?.text ?? "{}") as {
        query?: string;
        operationName?: string;
      };
      const match = body.query ? OP_RE.exec(body.query) : null;
      operationName = body.operationName ?? match?.[2] ?? "(anonymous)";
      operationType = match?.[1] ?? "query";
    } catch {
      operationName = "(unparsable request)";
    }
    let response: GraphqlExchange["response"] = null;
    try {
      response = JSON.parse(entry.response.content?.text ?? "") as GraphqlExchange["response"];
    } catch {
      response = null;
    }
    out.push({ operationName, operationType, response });
  }
  return out;
}
