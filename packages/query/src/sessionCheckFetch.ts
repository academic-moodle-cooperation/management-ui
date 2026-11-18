/**
 * `fetch` for the session check (`currentUser`).
 *
 * A backend behind single sign-on often answers an anonymous API request with a
 * redirect to its login page instead of a 401. The platform `fetch` follows that
 * redirect to the identity provider on another origin, where it fails the CORS
 * check and rejects with a bare `TypeError: Failed to fetch` — indistinguishable
 * from a backend outage. The auth layer then shows "couldn't verify your
 * session" to a visitor who simply isn't logged in.
 *
 * Requesting with `redirect: "manual"` stops at the redirect. The browser hands
 * back an opaque response (`type: "opaqueredirect"`, status 0), which this
 * wrapper turns into a regular 401 so the callers' existing "session invalid →
 * go to login" path applies. Intentionally NOT re-exported from the package
 * entry — it's an internal detail of `useGetCurrentUser`.
 */
import { fetchWithTimeout } from "./timeoutFetch";

const UNAUTHENTICATED_BODY = JSON.stringify({
  errors: [
    {
      message: "Unauthorized: the session check was redirected to a login page.",
      extensions: { code: "UNAUTHENTICATED" },
    },
  ],
});

/**
 * Build the session-check fetch on top of `baseFetch` (injectable for tests).
 */
export function createSessionCheckFetch(baseFetch: typeof fetch = fetchWithTimeout): typeof fetch {
  return async (input, init) => {
    const response = await baseFetch(input, { ...init, redirect: "manual" });
    if (response.type !== "opaqueredirect") {
      return response;
    }
    return new Response(UNAUTHENTICATED_BODY, {
      status: 401,
      statusText: "Unauthorized",
      headers: { "Content-Type": "application/json" },
    });
  };
}

/** The fetch `useGetCurrentUser` uses, with the default request timeout applied. */
export const sessionCheckFetch: typeof fetch = createSessionCheckFetch();
