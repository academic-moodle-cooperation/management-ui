/**
 * Central, env-driven configuration for the integration-E2E suite.
 *
 * Every value the suite needs to reach the real podman Opencast is read from an
 * env var with a sensible default for a local podman setup. Override any of them
 * without touching code — see tests/integration/README.md.
 *
 * Design notes / "confirm locally" items are documented in
 * tests/integration/README.md → "podman / Opencast integration".
 */

function env(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.length > 0 ? value : fallback;
}

function flag(name: string): boolean {
  const value = process.env[name];
  return value === "1" || value === "true";
}

/**
 * Base URL of the running Opencast, as reachable *from the host*.
 *
 * Defaults to `http://opencast-runtime:8080` to match Opencast's own
 * `org.opencastproject.server.url` (opencast-podman/env.sh) — Opencast is
 * picky about the host header matching that URL during auth redirects. This
 * requires `127.0.0.1 opencast-runtime` in /etc/hosts (the podman project
 * assumes the same line). If you reach your Opencast some other way, set
 * OPENCAST_BASE_URL.
 */
export const OPENCAST_BASE_URL = env("OPENCAST_BASE_URL", "http://opencast-runtime:8080");

/** Health endpoint polled by the global setup. Public in Opencast (returns the
 *  anonymous user with 200 before login), so no auth needed just to know it's up. */
export const OPENCAST_HEALTH_PATH = env("OPENCAST_HEALTH_PATH", "/info/me.json");

/** Seed credentials for the login flow (§15). Defaults from the podman
 *  compose file's ORG_OPENCASTPROJECT_SECURITY_ADMIN_USER/PASS. */
export const OPENCAST_USER = env("OPENCAST_USER", "admin");
export const OPENCAST_PASS = env("OPENCAST_PASS", "opencast");

/** Opencast major version you start with `./runtime.sh start <version>`.
 *  Only needed for autostart and for the §10 JAR target dir (target/<version>/jar). */
export const OPENCAST_VERSION = env("OPENCAST_VERSION", "");

/** Where the opencast-podman checkout lives. Required only when autostart is
 *  enabled; left empty otherwise so we never guess a path that doesn't exist. */
export const OPENCAST_PODMAN_DIR = env("OPENCAST_PODMAN_DIR", "");

/** podman container name of the Opencast runtime (compose container_name). */
export const OPENCAST_CONTAINER = env("OPENCAST_CONTAINER", "opencast-runtime");

/** OSGi/Karaf deploy dir inside the container (Felix fileinstall, 30s poll). */
export const OPENCAST_DEPLOY_DIR = env("OPENCAST_DEPLOY_DIR", "/opt/opencast/deploy");

/** If the health check fails and this is set, the global setup will try
 *  `runtime.sh start <version>` once (requires OPENCAST_PODMAN_DIR). */
export const OPENCAST_AUTOSTART = flag("OPENCAST_AUTOSTART");

/** Only stop the stack on teardown if *we* started it and this is set. */
export const OPENCAST_AUTOSTOP = flag("OPENCAST_AUTOSTOP");

/** Shell dev server the tests drive. The shell proxies /graphql, /info/me.json,
 *  /j_spring_security_*, config + plugins to OPENCAST_BASE_URL (VITE_PROXY_TARGET). */
export const SHELL_PORT = Number(env("SHELL_PORT", "3000"));
export const SHELL_BASE_PATH = "/management-ui/";
export const SHELL_ORIGIN = `http://127.0.0.1:${SHELL_PORT}`;
export const SHELL_BASE_URL = `${SHELL_ORIGIN}${SHELL_BASE_PATH}`;

/** Opencast form-login endpoints (dev mode uses j_spring_security_*). Both are
 *  in the shell's proxy allow-list, so posting to them through :3000 binds the
 *  session cookie to 127.0.0.1:3000 (where the browser lives). */
export const LOGIN_CHECK_PATH = env("LOGIN_CHECK_PATH", "/j_spring_security_check");

/** Saved authenticated browser state produced by auth.setup.ts. */
export const STORAGE_STATE = "playwright/.auth/opencast.json";

/** How long the global setup waits for Opencast to answer the health probe. */
export const HEALTH_TIMEOUT_MS = Number(env("OPENCAST_HEALTH_TIMEOUT_MS", "120000"));
