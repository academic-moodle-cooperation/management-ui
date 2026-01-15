import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";

import "@workspace/ui/globals.css";
import { loadNamespace, useTranslation } from "@workspace/i18n";
import { PluginProvider } from "@workspace/plugin-system";
import { AppProviders } from "@workspace/providers";
import { useAppConfig , QueryProvider } from "@workspace/query";
import { AppLoader } from "@workspace/ui/components";

import { DynamicRouterProvider } from "./components/DynamicRouterProvider";
import { PluginInitializer } from "./components/PluginInitializer";

import type { AnyRouter } from "@tanstack/react-router";

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
    const themeName = config.app.theme || "default";
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

    const key = `../../../plugins/themes/${themeName}.css`;
    const loader = themeModules[key];

    if (loader) {
      loader().catch(() => import("../../../plugins/themes/default.css"));
    } else if (themeName !== "default") {
      import("../../../plugins/themes/default.css");
    }
  }, [config]);

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
const AppContainer = () => {
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
