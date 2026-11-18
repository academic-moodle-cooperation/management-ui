import { describe, it, expect, vi } from "vitest";

import { createSessionCheckFetch } from "./sessionCheckFetch";

describe("createSessionCheckFetch", () => {
  it("asks the base fetch not to follow redirects", async () => {
    const base = vi.fn<typeof fetch>(async () => new Response("{}"));
    const sessionFetch = createSessionCheckFetch(base);

    await sessionFetch("https://example.test/graphql", { method: "POST" });

    expect(base).toHaveBeenCalledTimes(1);
    expect(base.mock.calls[0]![1]).toMatchObject({ method: "POST", redirect: "manual" });
  });

  it("passes a normal response through untouched", async () => {
    const response = new Response('{"data":{}}', { status: 200 });
    const sessionFetch = createSessionCheckFetch((async () => response) as typeof fetch);

    expect(await sessionFetch("https://example.test/graphql")).toBe(response);
  });

  it("turns a redirect (e.g. to an SSO login page) into a 401", async () => {
    // What the browser returns for a redirect under `redirect: "manual"`.
    const opaqueRedirect = { type: "opaqueredirect", status: 0, ok: false } as Response;
    const sessionFetch = createSessionCheckFetch((async () => opaqueRedirect) as typeof fetch);

    const result = await sessionFetch("https://example.test/graphql");

    expect(result.status).toBe(401);
    const body = (await result.json()) as { errors: { extensions: { code: string } }[] };
    expect(body.errors[0]!.extensions.code).toBe("UNAUTHENTICATED");
  });

  it("still rejects when the base fetch fails (a real outage)", async () => {
    const failing = (async () => {
      throw new TypeError("Failed to fetch");
    }) as typeof fetch;

    await expect(createSessionCheckFetch(failing)("https://example.test/graphql")).rejects.toThrow(
      "Failed to fetch",
    );
  });
});
