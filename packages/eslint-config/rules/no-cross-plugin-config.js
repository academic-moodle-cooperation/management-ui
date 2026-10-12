/**
 * no-cross-plugin-config
 *
 * Makes the config-slice boundary mechanical (#323): nothing reads the raw
 * `plugins` map off an `AppConfig` — not another plugin's slice, and not even
 * a plugin's own. The one sanctioned surface is a `definePluginConfig` reader
 * (`myConfig.use()` / `myConfig.read(config)`), which validates the slice and
 * falls back to defaults on bad input; raw reads bypass exactly that, so a
 * deployment typo surfaces as `undefined` deep in a component instead of a
 * logged validation warning.
 *
 * Matched shapes — member access (incl. optional/computed) on `plugins`
 * where the object is a `config` binding or a `.config` chain tail:
 *
 *   useAppConfig().config.plugins["other-plugin"]
 *   config.plugins.episodes
 *   config?.plugins?.[id]
 *
 * NOT matched: property keys when *building* a config object (test fixtures,
 * `{ plugins: { ... } }`), `somethingElse.plugins`, and type positions.
 *
 * The infrastructure that legitimately touches the raw map is enumerated as
 * `ignores` in base.js next to this rule's wiring: the reader implementation
 * itself, the config-merge tests, and the host's route protection (which by
 * design reads any plugin's `protection` subkey).
 */

const RULE_NAME = "no-cross-plugin-config";

/** Is this node a `config` identifier or a member chain ending in `.config`? */
const isConfigObject = (node) => {
  if (node.type === "Identifier") {
    return node.name === "config";
  }
  if (node.type === "MemberExpression" && !node.computed) {
    return node.property.type === "Identifier" && node.property.name === "config";
  }
  if (node.type === "ChainExpression") {
    return isConfigObject(node.expression);
  }
  return false;
};

/** @type {import("eslint").Rule.RuleModule} */
export const noCrossPluginConfig = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Forbid raw reads of AppConfig's `plugins` map — consume config through a definePluginConfig reader",
    },
    messages: {
      rawPluginsRead:
        "Do not read `{{source}}.plugins` directly — it bypasses slice validation. Consume your plugin's slice through its definePluginConfig reader (`myConfig.use()` / `myConfig.read(config)`); another plugin's slice is off-limits entirely (AGENTS.md → Config).",
    },
    schema: [],
  },

  create(context) {
    return {
      MemberExpression(node) {
        const isPluginsAccess = node.computed
          ? node.property.type === "Literal" && node.property.value === "plugins"
          : node.property.type === "Identifier" && node.property.name === "plugins";
        if (!isPluginsAccess) return;
        if (!isConfigObject(node.object)) return;

        context.report({
          node,
          messageId: "rawPluginsRead",
          data: {
            source: node.object.type === "Identifier" ? node.object.name : "….config",
          },
        });
      },
    };
  },
};

export const ruleName = RULE_NAME;
