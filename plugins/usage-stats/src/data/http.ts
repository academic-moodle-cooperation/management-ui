/** Shared fetch plumbing for the two Opencast-backed providers. */

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export const defaultFetch: FetchLike = (input, init) => fetch(input, init);

const isJsonResponse = (response: Response): boolean =>
  (response.headers.get("content-type") ?? "").toLowerCase().includes("json");

/**
 * GET/POST a JSON endpoint on the Opencast origin. Non-2xx answers and
 * non-JSON bodies (the dev server's SPA fallback serves HTML with 200)
 * both throw, so a missing module turns into a clean "unavailable".
 */
export const fetchJson = async (
  fetchImpl: FetchLike,
  url: string,
  init: RequestInit = {},
): Promise<unknown> => {
  const response = await fetchImpl(url, {
    ...init,
    headers: { Accept: "application/json", ...(init.headers ?? {}) },
    credentials: "same-origin",
  });
  if (!response.ok || !isJsonResponse(response)) {
    throw new Error(`${url} answered HTTP ${response.status}`);
  }
  return response.json();
};

/** Opencast serialises single-element lists as a bare object; accept both. */
export const asArray = <T>(value: T | T[] | null | undefined): T[] =>
  value == null ? [] : Array.isArray(value) ? value : [value];
