/**
 * The Opencast major this Management UI build targets (19, 20, …).
 *
 * The shell sets it at boot from its `VERSION`-derived build constant; a
 * plugin reads it to gate features that need a newer backend — the playlist
 * operations in `@oc-mui/query` exist on every line, but only an Opencast 20
 * backend answers them (see `queries.oc20.graphql`).
 *
 * `undefined` outside the shell (tests, a plugin dev server without the
 * host): callers should treat that as "unknown" and not as "unsupported".
 */
const GLOBAL_KEY = "__OC_MUI_OPENCAST_MAJOR__";

export function getOpencastMajor(): number | undefined {
  const value = (globalThis as Record<string, unknown>)[GLOBAL_KEY];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

/** Host-side: record the major the running shell was built for. */
export function setOpencastMajor(major: number): void {
  (globalThis as Record<string, unknown>)[GLOBAL_KEY] = major;
}

/**
 * `true` when the host targets `min` or newer. Unknown (no host) is reported
 * as `false` with `assumeWhenUnknown` left at its default; a dev server that
 * wants the newest features regardless can pass `true`.
 */
export function supportsOpencastMajor(min: number, assumeWhenUnknown = false): boolean {
  const major = getOpencastMajor();
  return major === undefined ? assumeWhenUnknown : major >= min;
}
