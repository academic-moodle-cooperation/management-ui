/**
 * Per-request timeout for the GraphQL client.
 *
 * `graphql-request` uses the platform `fetch`, which has **no default timeout**.
 * When the backend host is unreachable-but-routed (e.g. VPN up, machine down),
 * the TCP connection is black-holed: `fetch` neither resolves nor rejects, so a
 * query stays `pending` forever and callers that gate on it — most visibly the
 * auth check — spin on "Checking authentication…" indefinitely instead of
 * surfacing an error.
 *
 * Wrapping `fetch` with an `AbortSignal.timeout` deadline converts that hang
 * into a prompt rejection, which TanStack Query reports as an error and the UI
 * can act on (retry / error screen). This module is intentionally NOT re-exported
 * from the package entry — it's an internal detail of the GraphQL client.
 */

/**
 * Default per-request deadline (ms). Generous enough for a slow-but-alive
 * backend, short enough that an unreachable one fails before the user gives up.
 * Note: the QueryClient default `retry: 1` means a fully black-holed request can
 * take up to ~2× this before it finally errors.
 */
export const DEFAULT_REQUEST_TIMEOUT_MS = 15_000;

/**
 * Build a `fetch` wrapper that aborts each request after `timeoutMs`.
 *
 * A fresh `AbortSignal.timeout` is created per call so retries get their own
 * deadline, and it's combined with any caller-supplied `signal` (so an explicit
 * abort still works). In environments without `AbortSignal.timeout` it degrades
 * to the underlying fetch unchanged.
 *
 * @param timeoutMs - Per-request deadline in milliseconds.
 * @param baseFetch - Underlying fetch implementation (injectable for tests).
 */
export function createTimeoutFetch(
  timeoutMs: number,
  baseFetch: typeof fetch = (...args) => fetch(...args),
): typeof fetch {
  return (input, init) => {
    if (typeof AbortSignal === "undefined" || typeof AbortSignal.timeout !== "function") {
      return baseFetch(input, init);
    }

    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    const signal =
      init?.signal && typeof AbortSignal.any === "function"
        ? AbortSignal.any([init.signal, timeoutSignal])
        : (init?.signal ?? timeoutSignal);

    return baseFetch(input, { ...init, signal });
  };
}

/** The wrapper the GraphQL client uses, with the default deadline applied. */
export const fetchWithTimeout: typeof fetch = createTimeoutFetch(DEFAULT_REQUEST_TIMEOUT_MS);
