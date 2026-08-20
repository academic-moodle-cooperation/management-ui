/**
 * Tests for no-cross-plugin-config: raw reads of AppConfig's `plugins` map
 * are flagged; building config objects and unrelated `.plugins` members are
 * not.
 */

import { RuleTester } from "eslint";
import { afterAll, describe, it } from "vitest";

import { noCrossPluginConfig } from "./no-cross-plugin-config.js";

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;
RuleTester.afterAll = afterAll;

const tester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: "module" },
});

tester.run("no-cross-plugin-config", noCrossPluginConfig, {
  valid: [
    // The sanctioned surface: a definePluginConfig reader.
    { code: "const cfg = episodesConfig.use();" },
    { code: "const cfg = episodesConfig.read(config);" },
    // Building a config object (test fixtures) is a property KEY, not a read.
    { code: "const config = { plugins: { episodes: { enabled: true } } };" },
    { code: "const merged = { ...defaultConfig, plugins: { ...defaultConfig.plugins } };" },
    // `.plugins` on something that is not a config.
    { code: "manager.plugins.get(name);" },
    { code: "const list = registry.plugins;" },
  ],
  invalid: [
    {
      code: 'const other = useAppConfig().config.plugins["other-plugin"];',
      errors: [{ messageId: "rawPluginsRead" }],
    },
    {
      code: "const mine = config.plugins.episodes;",
      errors: [{ messageId: "rawPluginsRead" }],
    },
    {
      code: "const slice = config?.plugins?.[id];",
      errors: [{ messageId: "rawPluginsRead" }],
    },
    {
      code: 'const slice = config["plugins"]["series"];',
      errors: [{ messageId: "rawPluginsRead" }],
    },
  ],
});
