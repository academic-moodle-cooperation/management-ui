import { i18next } from "@oc-mui/i18n";

import de from "../locales/live-polls/de.json";
import en from "../locales/live-polls/en.json";

export const LIVE_POLLS_I18N_NS = "live-polls";

/**
 * Register the plugin's bundled translations on the shared i18next instance.
 *
 * In-tree plugins are imported statically, so the runtime's remote-locale
 * registration (`registerPluginI18nNamespaces`, used only for JAR / .local-plugins
 * bundles in `PluginInitializer`) never runs for them. We therefore add the
 * bundled resources directly. This must happen *before first render*: the sidebar
 * only translates a namespaced nav title when `i18n.exists(key)` is already true
 * (see `packages/ui/.../nav-main.tsx`), and it renders as soon as the shell mounts.
 *
 * The same JSON files are also shipped under `locales/` (copied to `dist/locales`
 * by the shell Vite config) so the contract test's i18n key-parity check has
 * files to compare and a deployment can still override them over HTTP.
 */
let registered = false;

export function registerLivePollsI18n(): void {
  if (registered) return;
  registered = true;
  i18next.addResourceBundle("en", LIVE_POLLS_I18N_NS, en, true, true);
  i18next.addResourceBundle("de", LIVE_POLLS_I18N_NS, de, true, true);
}

// Register on import so the namespace exists before any component renders.
registerLivePollsI18n();
