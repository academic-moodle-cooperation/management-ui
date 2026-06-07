import { expect, test } from "@playwright/test";

/**
 * test-protocol.md §15 — Authentication, the parts the auth.setup.ts login
 * doesn't already cover. These run *unauthenticated*, so they override the
 * project's saved storageState with an empty one.
 */
test.use({ storageState: { cookies: [], origins: [] } });

test("§15.3 a protected route while signed out redirects to login", async ({ page }) => {
  await page.goto("/management-ui/episodes");

  // The shell bounces an unauthenticated user to its /login route, which in dev
  // forwards to Opencast's Spring Security form. Either the URL lands on a login
  // path or the form's username field appears — and we must NOT see the table.
  await expect
    .poll(
      async () => {
        const onLoginUrl = /login|j_spring_security/i.test(page.url());
        const formVisible = await page
          .locator('input[name="j_username"]')
          .isVisible()
          .catch(() => false);
        return onLoginUrl || formVisible;
      },
      { timeout: 20_000, message: `stayed on ${page.url()}` },
    )
    .toBe(true);

  await expect(page.getByRole("table")).toHaveCount(0);
});
