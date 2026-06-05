import { describe, it, expect, vi } from "vitest";

import { createTimeoutFetch, DEFAULT_REQUEST_TIMEOUT_MS } from "./timeoutFetch";

describe("createTimeoutFetch", () => {
  it("forwards to the base fetch with an abort signal and resolves normally", async () => {
    const response = {} as Response;
    let received: AbortSignal | undefined;
    const base = vi.fn(async (_input: string | URL, init?: RequestInit) => {
      received = init?.signal ?? undefined;
      return response;
    });
    const tf = createTimeoutFetch(1000, base as unknown as typeof fetch);

    const result = await tf("https://example.test/graphql");

    expect(result).toBe(response);
    expect(base).toHaveBeenCalledTimes(1);
    expect(received).toBeInstanceOf(AbortSignal);
  });

  it("rejects with a TimeoutError when the base fetch outlives the deadline", async () => {
    // A fetch that never resolves on its own but rejects when aborted — exactly
    // how the platform fetch behaves against a black-holed connection.
    const hangingFetch = ((_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () =>
          reject((init.signal as AbortSignal).reason),
        );
      })) as typeof fetch;

    const tf = createTimeoutFetch(10, hangingFetch);

    await expect(tf("https://example.test/graphql")).rejects.toMatchObject({
      name: "TimeoutError",
    });
  });

  it("still attaches a signal when the caller supplies its own", async () => {
    let received: AbortSignal | undefined;
    const base = vi.fn(async (_input: string | URL, init?: RequestInit) => {
      received = init?.signal ?? undefined;
      return {} as Response;
    });
    const tf = createTimeoutFetch(1000, base as unknown as typeof fetch);
    const controller = new AbortController();

    await tf("https://example.test/graphql", { signal: controller.signal });

    expect(received).toBeInstanceOf(AbortSignal);
  });

  it("exposes a positive default deadline", () => {
    expect(DEFAULT_REQUEST_TIMEOUT_MS).toBeGreaterThan(0);
  });
});
