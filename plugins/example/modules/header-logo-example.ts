import { createPlugin, type PluginManager } from "@opencast-mui/plugin-system";
import { logger } from "@opencast-mui/utils";

/**
 * Minimal reference plugin: register a logo on the app header.
 *
 * Demonstrates:
 *   1. Declaring a plugin via createPlugin (manifest + lifecycle).
 *   2. Registering an object on an extension point (`app:header-logo`) during
 *      initialize(), which is the only phase allowed to mutate the plugin
 *      manager registry.
 *   3. Keeping activate/deactivate free of side effects beyond logging.
 *
 * The `src` and `href` values are placeholders on purpose - replace them in
 * your own plugin. Organization-specific branding must not live in this
 * core example plugin; it belongs in your own plugin under .local-plugins/
 * or a community plugin repository.
 */
export const exampleHeaderLogoPlugin = createPlugin({
  namespace: "example",
  type: "header",
  version: "1.0.0",

  initialize(manager: PluginManager) {
    logger.debug("[plugin-example] registering header logo");

    manager.registerObject("app:header-logo", "example-logo", {
      src: "/assets/example-logo.svg",
      alt: "Example",
      width: 120,
      height: 40,
      href: "/",
    });
  },

  activate() {
    logger.debug("[plugin-example] activated");
  },

  deactivate() {
    logger.debug("[plugin-example] deactivated");
  },
});
