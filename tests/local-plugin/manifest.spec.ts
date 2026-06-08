import { expect, test } from "@playwright/test";

/**
 * test-protocol.md §9.5 — the dev server exposes scaffolded .local-plugins via
 * /management-ui/local-plugins/manifest.json. The demo plugin was scaffolded +
 * built by global-setup.ts before the dev server (webServer) started.
 */
test("§9.5 the dev local-plugins manifest lists the built plugin", async ({ request }) => {
  const res = await request.get("local-plugins/manifest.json");
  expect(res.ok(), `manifest returned ${res.status()}`).toBeTruthy();

  const body = (await res.json()) as {
    plugins?: Array<{ name?: string; id?: string; url?: string }>;
  };
  const entry = (body.plugins ?? []).find((p) => p.name === "demo-local" || p.id === "demo-local");
  expect(entry, `demo-local not in manifest: ${JSON.stringify(body)}`).toBeTruthy();
  // …and it points at the built bundle the dev server serves.
  expect(entry?.url).toContain("demo-local");
});
