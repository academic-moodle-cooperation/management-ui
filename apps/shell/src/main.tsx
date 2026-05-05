import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";

import "@workspace/ui/globals.css";
import "./themes/default.css";
import { loadNamespace, useTranslation } from "@workspace/i18n";
import { PluginProvider } from "@workspace/plugin-system";
import { AppProviders } from "@workspace/providers";
import { useAppConfig, QueryProvider } from "@workspace/query";
import { type AnyRouter } from "@workspace/router";
import { AppLoader } from "@workspace/ui/components";

import { DynamicRouterProvider } from "./components/DynamicRouterProvider";
import { PluginInitializer } from "./components/PluginInitializer";
import { exposeSharedModules } from "./shared/sharedModules";

// Expose shared modules early for community plugins
exposeSharedModules();

const AppContent = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    loadNamespace("common", i18n.language);
  }, [i18n.language]);

  return <AppWithConfig />;
};

const AppWithConfig = () => {
  const { config, isLoading } = useAppConfig();
  const themeModules = import.meta.glob("../../../plugins/themes/*.css", {
    eager: false,
    query: "?rcss",
  });

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

      if (loader) {
        loader().catch(() => undefined);
      } else if (import.meta.env.DEV) {
        // In dev, try .local-plugins/<name>/themes/<name>.css (migrated org themes)
        document.querySelectorAll("link[data-theme]").forEach((el) => el.remove());
        const base = import.meta.env.BASE_URL ?? "/";
        const themeUrl = `${base.replace(/\/$/, "")}/local-plugins/${themeName}/themes/${themeName}.css`;
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = themeUrl;
        link.dataset["theme"] = themeName;
        document.head.appendChild(link);
      } else {
        // Production: load theme from JAR (same path as plugin: /static/plugins/<name>/<name>.css)
        document.querySelectorAll("link[data-theme]").forEach((el) => el.remove());
        const base = import.meta.env.BASE_URL ?? "/";
        const themeUrl = `${base.replace(/\/$/, "")}/static/plugins/${themeName}/${themeName}.css`;
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = themeUrl;
        link.dataset["theme"] = themeName;
        document.head.appendChild(link);
      }
    }
  }, [config, themeModules]);

  // If config is not ready, show a loading state
  if (isLoading) return <AppLoader>Loading configuration...</AppLoader>;

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
    <AppContainer />
  </React.StrictMode>,
);
