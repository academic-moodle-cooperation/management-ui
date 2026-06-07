import type { Page, Request } from "@playwright/test";

export interface GraphqlCall {
  /** Operation name parsed from the request body, e.g. "MuiGetMyEvents". */
  operationName: string;
  /** "query" | "mutation" | "subscription". */
  operationType: string;
  variables: unknown;
  /** Parsed JSON response body ({ data, errors }). */
  response: { data?: unknown; errors?: unknown[] } | null;
}

const OP_RE = /\b(query|mutation|subscription)\s+(\w+)/;

function parseOperation(body: string | null): {
  operationType: string;
  operationName: string;
  variables: unknown;
} {
  if (!body) return { operationType: "unknown", operationName: "(no body)", variables: undefined };
  try {
    const json = JSON.parse(body) as {
      query?: string;
      operationName?: string;
      variables?: unknown;
    };
    const match = json.query ? OP_RE.exec(json.query) : null;
    return {
      operationType: match?.[1] ?? "query",
      operationName: json.operationName ?? match?.[2] ?? "(anonymous)",
      variables: json.variables,
    };
  } catch {
    return { operationType: "unknown", operationName: "(unparsable)", variables: undefined };
  }
}

/**
 * Records every POST the page makes to a GraphQL endpoint, pairing each request
 * (for the operation name + variables) with its response body (for data/errors).
 * This is the machinery behind test-protocol.md §4 — instead of a human reading
 * the Network tab, the test asserts on the same payloads.
 */
export class GraphqlRecorder {
  readonly calls: GraphqlCall[] = [];

  private constructor() {}

  static attach(page: Page, endpointGlob = "**/graphql"): GraphqlRecorder {
    const recorder = new GraphqlRecorder();
    page.on("response", async (response) => {
      const request: Request = response.request();
      if (request.method() !== "POST") return;
      if (!response.url().includes("/graphql")) return;
      const { operationType, operationName, variables } = parseOperation(request.postData());
      let parsed: GraphqlCall["response"] = null;
      try {
        parsed = (await response.json()) as GraphqlCall["response"];
      } catch {
        parsed = null;
      }
      recorder.calls.push({ operationType, operationName, variables, response: parsed });
    });
    return recorder;
  }

  /** All recorded calls for a given operation name. */
  byName(operationName: string): GraphqlCall[] {
    return this.calls.filter((c) => c.operationName === operationName);
  }

  /** Distinct operation names seen so far — handy for diagnostics. */
  operationNames(): string[] {
    return [...new Set(this.calls.map((c) => c.operationName))];
  }
}
