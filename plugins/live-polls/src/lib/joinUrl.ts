/** Helpers for the audience join link (`/live-polls/join?code=…`). */

const JOIN_PATH = "live-polls/join";

/** Absolute URL the audience opens to join a session (shown + copyable). */
export function buildJoinUrl(code: string): string {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  const path = `${base}/${JOIN_PATH}?code=${encodeURIComponent(code)}`;
  if (typeof window !== "undefined") return `${window.location.origin}${path}`;
  return path;
}

/** The in-app route path (no origin) for client-side navigation. */
export function joinRoutePath(code: string): string {
  return `/${JOIN_PATH}?code=${encodeURIComponent(code)}`;
}

/** Read + normalise the join code from the current URL's query string. */
export function readJoinCodeFromUrl(): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("code")?.trim().toUpperCase() ?? "";
}
