import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

import { expect, test as setup } from "@playwright/test";

import { LOGIN_CHECK_PATH, OPENCAST_PASS, OPENCAST_USER, STORAGE_STATE } from "./opencast-env";

/**
 * Authenticate against the real Opencast once and persist the browser session,
 * so the data-driven specs (§3, §4) start logged in. This is also the first
 * automated coverage of test-protocol.md §15 (Authentication).
 *
 * We log in through the *shell's* proxy (POST 127.0.0.1:3000/j_spring_security_check),
 * not against Opencast directly, so the JSESSIONID cookie binds to the origin
 * the browser actually talks to. Opencast's form login is the dev-mode auth
 * path (config.auth.loginUrlDev = /j_spring_security_login).
 *
 * NOTE (confirm locally): the exact form field names / success signal are
 * Opencast's Spring Security defaults. If your deployment customised them,
 * adjust the `form` payload below.
 */
setup("authenticate against opencast", async ({ request }) => {
  const res = await request.post(LOGIN_CHECK_PATH, {
    form: { j_username: OPENCAST_USER, j_password: OPENCAST_PASS },
    // Inspect the redirect ourselves rather than following into the SPA.
    maxRedirects: 0,
  });

  // Spring Security answers a successful form login with a 302 to the target,
  // and a failed one with a 302 to an error page (…?error or /login?error).
  expect(
    res.status(),
    `login POST returned ${res.status()} (expected a 3xx redirect)`,
  ).toBeGreaterThanOrEqual(300);
  expect(res.status()).toBeLessThan(400);
  const location = res.headers()["location"] ?? "";
  expect(location, `login redirected to an error page: ${location}`).not.toMatch(
    /error|login|denied/i,
  );

  // Prove the session is really authenticated: /info/me.json should now report
  // our user, not the anonymous one.
  const me = await request.get("/info/me.json");
  expect(me.ok(), `/info/me.json returned ${me.status()}`).toBeTruthy();
  const meBody = (await me.json()) as { user?: { username?: string } };
  expect(meBody.user?.username).toBe(OPENCAST_USER);

  await mkdir(dirname(STORAGE_STATE), { recursive: true });
  await request.storageState({ path: STORAGE_STATE });
});
