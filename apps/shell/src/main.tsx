import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";

// Order matters and is load-bearing: the library stylesheet ships its own
// Tailwind build (scanning only `packages/ui`), this app's ships another
// (scanning apps and plugins). Whichever lands last wins ties, so the broader
// build has to come second — otherwise a base utility from the library beats a
// responsive variant only the app generated. See the note in `app.css`.
import "@oc-mui/ui/globals.css";
import "./app.css";
import "./themes/default.css";
import { applyConfiguredLanguage, loadNamespace, useTranslation } from "@oc-mui/i18n";
import { PluginProvider } from "@oc-mui/plugin-system";
import { AppProviders } from "@oc-mui/providers";
import { useAppConfig, QueryProvider } from "@oc-mui/query";
import { type AnyRouter, Link as RouterLink, useRouterState } from "@oc-mui/router";
import {
  AppLoader,
  ThemeModeProvider,
  UiRouterProvider,
  type UiRouterPrimitives,
} from "@oc-mui/ui/components";

import { ConfigLoadError } from "./components/ConfigLoadError";
import { DynamicRouterProvider } from "./components/DynamicRouterProvider";
import { PluginInitializer } from "./components/PluginInitializer";
import { exposeSharedModules } from "./shared/sharedModules";

// Expose shared modules early for community plugins
exposeSharedModules();

// Router primitives injected into @oc-mui/ui's router-aware components
// (NavMain, the data table) so @oc-mui/ui itself stays router-free — see
// @oc-mui/ui's router-context. Filled with @oc-mui/router's real Link and a
// useRouterState-derived pathname; only invoked deep inside the RouterProvider.
function useRouterPathname() {
  return useRouterState({ select: (s) => s?.location?.pathname ?? "" });
}
const uiRouterPrimitives: UiRouterPrimitives = {
  Link: RouterLink as unknown as UiRouterPrimitives["Link"],
  usePathname: useRouterPathname,
};

const AppContent = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    loadNamespace("common", i18n.language);
  }, [i18n.language]);

  return <AppWithConfig />;
};

const AppWithConfig = () => {
  const { config, isLoading, isError, error, configUrl, refetch } = useAppConfig();
  const themeModules = import.meta.glob("../../../plugins/themes/*.css", {
    eager: false,
    query: "?rcss",
  });

  // `app.locale` is the deployment's default language. It is applied here,
  // once — the user's own pick from the language switcher is remembered and
  // takes precedence, so this is a starting point, not a lock.
  useEffect(() => {
    void applyConfiguredLanguage(config.app.locale);
  }, [config.app.locale]);

  useEffect(() => {
    const themeName = config.app["theme"] || "default";
    document.title = `${import.meta.env.DEV ? "[DEV] " : ""}${config.app.HtmlDocumentTitle || "Management UI"}`;

    // Set favicon dynamically from config
    if (config.app.faviconUrl) {
      // Remove existing favicon links
      const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
      existingFavicons.forEach((link) => link.remove());

      // Add new favicon
      const faviconLink = document.createElement("link");
      faviconLink.rel = "icon";
      faviconLink.type = "image/svg+xml";
      faviconLink.href = config.app.faviconUrl;
      document.head.appendChild(faviconLink);

      // Add fallback ICO favicon if available
      const icoUrl = config.app.faviconUrl.replace(".svg", ".ico");
      const icoLink = document.createElement("link");
      icoLink.rel = "icon";
      icoLink.type = "image/x-icon";
      icoLink.href = icoUrl;
      document.head.appendChild(icoLink);
    }

    // "default" is always loaded as a baseline (see themes/default.css import
    // at the top of this file). Only non-default themes are loaded on top.
    if (themeName === "default") {
      document.querySelectorAll("link[data-theme]").forEach((el) => el.remove());
    } else {
      const key = `../../../plugins/themes/${themeName}.css`;
      const loader = themeModules[key];
      document.querySelectorAll("link[data-theme]").forEach((el) => el.remove());

      if (loader) {
        loader().catch(() => undefined);
      } else {
        // Resolve `<theme>.css` by probing known locations and injecting the
        // first that actually serves CSS. The dev server / SPA returns a
        // `200` index.html for missing paths, so `<link>` `onerror` never
        // fires — we check the `content-type` instead. Shipped showcase/
        // example themes live in `public/plugins/themes/` (the same raw-served
        // path the marketplace previews from); org themes live in
        // `.local-plugins/` (dev) or the JAR (`/static/plugins`, prod).
        const base = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
        const candidates = [
          `${base}/plugins/themes/${themeName}.css`,
          import.meta.env.DEV
            ? `${base}/local-plugins/${themeName}/themes/${themeName}.css`
            : `${base}/static/plugins/${themeName}/${themeName}.css`,
        ];
        void (async () => {
          for (const href of candidates) {
            try {
              const res = await fetch(href);
              if (res.ok && (res.headers.get("content-type") ?? "").includes("css")) {
                const link = document.createElement("link");
                link.rel = "stylesheet";
                link.href = href;
                link.dataset["theme"] = themeName;
                document.head.appendChild(link);
                return;
              }
            } catch {
              /* try next candidate */
            }
          }
        })();
      }
    }
  }, [config, themeModules]);

  // If config is not ready, show a loading state
  if (isLoading) return <AppLoader>Loading configuration...</AppLoader>;

  // If the config fetch failed, render a screen explaining what went wrong
  // instead of an indefinite loading spinner. The dev path tells you
  // exactly which env var fixes it; the prod path is a generic
  // "contact your admin". See ConfigLoadError for the messaging.
  if (isError) {
    return <ConfigLoadError error={error} configUrl={configUrl} onRetry={() => refetch()} />;
  }

  return (
    <PluginInitializer config={config}>
      <DynamicRouterProvider>
        {(router: AnyRouter) => <AppProviders router={router} />}
      </DynamicRouterProvider>
    </PluginInitializer>
  );
};

// Top level component that sets up QueryProvider first
export const AppContainer = () => {
  return (
    <PluginProvider>
      <QueryProvider>
        <AppContent />
      </QueryProvider>
    </PluginProvider>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeModeProvider>
      <UiRouterProvider value={uiRouterPrimitives}>
        <AppContainer />
      </UiRouterProvider>
    </ThemeModeProvider>
  </React.StrictMode>,
);
