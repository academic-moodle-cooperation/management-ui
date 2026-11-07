import { expect, test, type Page } from "@playwright/test";

import {
  PLUGIN_PAUSES_STORAGE_KEY,
  PLUGIN_PREVIEWS_STORAGE_KEY,
} from "../../packages/plugin-system/src/pluginPreviews";
import { defaultConfig } from "../../packages/ui-config/src";

import { stubShellBoot } from "./_mock-backend";

/**
 * test-protocol.md §6.3 — `config.plugins.<namespace>.enabled: false` holds on
 * the JAR and .local-plugins paths, not just for bundled plugins, and a
 * tab-scoped preview passes it. What counts is whether the shell fetches a remote plugin at all,
 * so the specs serve stub modules and record which ones were requested.
 */

type AppConfig = typeof defaultConfig;

interface RemoteModule {
  file: string;
  namespace?: string;
  type?: string;
  /** Registered on `app:config` when the module initializes. */
  overlay?: Record<string, unknown>;
}

const moduleSource = ({ file, namespace, type, overlay }: RemoteModule): string => `export default {
  name: ${JSON.stringify(`${namespace ?? file}:${type ?? "app"}`)},
  version: "1.0.0",
  initialize(manager) {
    ${overlay ? `manager.registerObject("app:config", "overlay", ${JSON.stringify(overlay)});` : ""}
  },
  activate() {},
  deactivate() {},
};`;

const jsonBody = (body: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify(body),
});

const LOAD_PATHS = [
  {
    title: "JAR",
    // CI runs the production build, which has the JAR path only.
    devOnly: false,
    moduleUrl: ({ file }: RemoteModule) => `/static/plugins/${file}/${file}.mjs`,
    serveList: (page: Page, modules: RemoteModule[]) =>
      page.route("**/management-tool/ui/config/plugins.json", (route) =>
        route.fulfill(
          jsonBody({
            plugins: modules.map((module) => ({
              name: `Display name of ${module.file}:${module.type ?? "app"}`,
              path: `/static/plugins/${module.file}`,
              scope: module.file,
              namespace: module.namespace,
              type: module.type,
              scriptUrl: `/static/plugins/${module.file}/${module.file}.mjs`,
            })),
          }),
        ),
      ),
  },
  {
    title: ".local-plugins",
    devOnly: true,
    moduleUrl: ({ file }: RemoteModule) => `/local-plugins/${file}/${file}.mjs`,
    serveList: (page: Page, modules: RemoteModule[]) =>
      page.route("**/local-plugins/manifest.json", (route) =>
        route.fulfill(
          jsonBody({
            plugins: modules.map((module) => ({
              name: `Display name of ${module.file}`,
              id: module.file,
              url: `/local-plugins/${module.file}/${module.file}.mjs`,
              namespace: module.namespace,
              type: module.type,
            })),
          }),
        ),
      ),
  },
] as const;

type LoadPath = (typeof LOAD_PATHS)[number];

const withConfig = (
  plugins: Record<string, unknown>,
  extraNamespaces: string[] = [],
): AppConfig => ({
  ...defaultConfig,
  app: {
    ...defaultConfig.app,
    enabledPlugins: [...defaultConfig.app.enabledPlugins, ...extraNamespaces],
  },
  plugins: { ...defaultConfig.plugins, ...plugins },
});

const setTabList = (page: Page, key: string, namespaces: string[]) =>
  page.addInitScript(
    ([storageKey, list]) => {
      window.sessionStorage.setItem(
        storageKey as string,
        JSON.stringify({ version: 1, namespaces: list }),
      );
    },
    [key, namespaces] as const,
  );

/** Boot the shell with `modules` on `path`; resolves to the files it fetched. */
async function bootAndListFetched(
  page: Page,
  path: LoadPath,
  config: AppConfig,
  modules: RemoteModule[],
): Promise<string[]> {
  const fetched = new Set<string>();

  await stubShellBoot(page, config);
  await path.serveList(page, modules);
  for (const module of modules) {
    // The loader adds a cache-busting query on local hosts.
    await page.route(`**${path.moduleUrl(module)}*`, (route) => {
      fetched.add(module.file);
      return route.fulfill({
        status: 200,
        contentType: "application/javascript",
        body: moduleSource(module),
      });
    });
  }

  await page.goto("/management-ui/");
  // The shell renders its children only after every load phase has finished.
  await expect(page.getByRole("link", { name: /home/i })).toBeVisible({ timeout: 15_000 });
  return [...fetched].sort();
}

for (const path of LOAD_PATHS) {
  test.describe(`${path.title} plugins`, () => {
    test.skip(
      path.devOnly && !!process.env["CI"],
      "the production build has no .local-plugins path",
    );

    test("a slice switched off in config.json keeps the plugin from loading", async ({ page }) => {
      const fetched = await bootAndListFetched(
        page,
        path,
        withConfig({ acme: { enabled: false } }, ["acme", "reports"]),
        [
          { file: "acme", namespace: "acme", type: "app" },
          { file: "reports", namespace: "reports", type: "app" },
        ],
      );
      expect(fetched).toEqual(["reports"]);
    });

    test("the switch is keyed by the entry's namespace, not its file or display name", async ({
      page,
    }) => {
      const fetched = await bootAndListFetched(
        page,
        path,
        // `other-file` is a file name here, so its slice must switch nothing off.
        withConfig({ acme: { enabled: false }, "other-file": { enabled: false } }, [
          "acme",
          "reports",
        ]),
        [
          { file: "bundle-file", namespace: "acme", type: "app" },
          { file: "other-file", namespace: "reports", type: "app" },
        ],
      );
      expect(fetched).toEqual(["other-file"]);
    });

    test("the switch holds for an entry that declares no type", async ({ page }) => {
      const fetched = await bootAndListFetched(
        page,
        path,
        withConfig({ acme: { enabled: false } }, ["acme", "reports"]),
        [
          { file: "acme", namespace: "acme" },
          { file: "reports", namespace: "reports" },
        ],
      );
      expect(fetched).toEqual(["reports"]);
    });

    test("a tab-scoped preview passes the switch", async ({ page }) => {
      await setTabList(page, PLUGIN_PREVIEWS_STORAGE_KEY, ["acme"]);
      const fetched = await bootAndListFetched(
        page,
        path,
        withConfig({ acme: { enabled: false } }, ["acme"]),
        [{ file: "acme", namespace: "acme", type: "app" }],
      );
      expect(fetched).toEqual(["acme"]);
    });

    test("a tab-scoped pause wins over a preview", async ({ page }) => {
      await setTabList(page, PLUGIN_PREVIEWS_STORAGE_KEY, ["acme"]);
      await setTabList(page, PLUGIN_PAUSES_STORAGE_KEY, ["acme"]);
      const fetched = await bootAndListFetched(page, path, withConfig({}, ["acme"]), [
        { file: "acme", namespace: "acme", type: "app" },
      ]);
      expect(fetched).toEqual([]);
    });

    // Both shapes a config plugin can declare: `type: config`, and the
    // `config` namespace of a `.local-plugins/config/` folder.
    for (const configModule of [
      { file: "settings", namespace: "settings", type: "config" },
      { file: "config", namespace: "config" },
    ]) {
      const label = configModule.type ? "type" : "namespace";

      test(`a switch contributed by a config plugin (by ${label}) holds, though the plugin is listed before the merge`, async ({
        page,
      }) => {
        const fetched = await bootAndListFetched(
          page,
          path,
          withConfig({}, ["settings", "acme", "reports"]),
          [
            { ...configModule, overlay: { plugins: { acme: { enabled: false } } } },
            { file: "acme", namespace: "acme", type: "app" },
            { file: "reports", namespace: "reports", type: "app" },
          ],
        );
        expect(fetched).toEqual([configModule.file, "reports"].sort());
      });
    }

    test("a config plugin can switch a plugin back on that config.json switched off", async ({
      page,
    }) => {
      const fetched = await bootAndListFetched(
        page,
        path,
        withConfig({ acme: { enabled: false } }, ["settings", "acme"]),
        [
          {
            file: "settings",
            namespace: "settings",
            type: "config",
            overlay: { plugins: { acme: { enabled: true } } },
          },
          { file: "acme", namespace: "acme", type: "app" },
        ],
      );
      expect(fetched).toEqual(["acme", "settings"]);
    });

    test("namespaces contributed by a config plugin load", async ({ page }) => {
      const fetched = await bootAndListFetched(page, path, withConfig({}, ["settings"]), [
        {
          file: "settings",
          namespace: "settings",
          type: "config",
          overlay: {
            app: { enabledPlugins: [...defaultConfig.app.enabledPlugins, "settings", "acme"] },
          },
        },
        { file: "acme", namespace: "acme", type: "app" },
      ]);
      expect(fetched).toEqual(["acme", "settings"]);
    });

    test("namespaces contributed by a plugin that does not declare itself as config load too", async ({
      page,
    }) => {
      const fetched = await bootAndListFetched(page, path, withConfig({}, ["settings"]), [
        {
          file: "settings",
          namespace: "settings",
          overlay: {
            app: { enabledPlugins: [...defaultConfig.app.enabledPlugins, "settings", "acme"] },
          },
        },
        { file: "acme", namespace: "acme", type: "app" },
      ]);
      expect(fetched).toEqual(["acme", "settings"]);
    });
  });
}

test("an entry without a namespace has no slice to read and loads", async ({ page }) => {
  const [jar] = LOAD_PATHS;
  const fetched = await bootAndListFetched(page, jar, withConfig({ legacy: { enabled: false } }), [
    { file: "legacy" },
  ]);
  expect(fetched).toEqual(["legacy"]);
});

test.describe("bundled plugins", () => {
  test("§6.3 a slice switched off in config.json hides the plugin", async ({ page }) => {
    await stubShellBoot(page, withConfig({ episodes: { enabled: false } }));
    await page.goto("/management-ui/");

    await expect(page.getByRole("link", { name: /series/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("link", { name: /videos/i })).toHaveCount(0);
  });

  test("a tab-scoped preview passes the switch", async ({ page }) => {
    await setTabList(page, PLUGIN_PREVIEWS_STORAGE_KEY, ["episodes"]);
    await stubShellBoot(page, withConfig({ episodes: { enabled: false } }));
    await page.goto("/management-ui/");

    await expect(page.getByRole("link", { name: /videos/i })).toBeVisible({ timeout: 15_000 });
  });
});
