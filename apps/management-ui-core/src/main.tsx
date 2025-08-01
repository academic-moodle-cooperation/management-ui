import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import '@workspace/ui/globals.css';
import { AppProviders } from '@workspace/providers';
import { createDynamicRouter } from './app-router';
import type { AnyRouter } from '@tanstack/react-router';
import { AppLoader } from '@workspace/ui/components';
import { useAppConfig } from '@workspace/query';
import { QueryProvider } from '@workspace/query';
import { PluginInitializer } from './components/PluginInitializer';
import { PluginProvider } from '@workspace/plugin-system';
import { loadNamespace, useTranslation } from '@workspace/i18n';

const AppContent = () => {
  const [router, setRouter] = useState<AnyRouter | null>(null);
  const [routerError, setRouterError] = useState<Error | null>(null);
  const [isRouterLoading, setIsRouterLoading] = useState(true);
  const { i18n } = useTranslation();

  useEffect(() => {
    createDynamicRouter()
      .then(createdRouter => setRouter(createdRouter))
      .catch(err => setRouterError(err instanceof Error ? err : new Error('Unknown error creating router')))
      .finally(() => setIsRouterLoading(false));
  }, []);

  useEffect(() => {
    loadNamespace("common", i18n.language);
  }, [i18n.language]);

  if (isRouterLoading) return <AppLoader />;
  if (routerError) return <div>Error initializing router: {routerError.message}</div>;
  if (!router) return <div>Router not available.</div>;

  return (
    <AppWithConfig router={router} />
  );
};

const AppWithConfig = ({ router }: { router: AnyRouter }) => {
  const { config, isLoading } = useAppConfig();
  const themeModules = import.meta.glob(
    '../../../plugins/themes/*.css',
    { eager: false, query: '?rcss' }
  );

  useEffect(() => {
    const themeName = config.app.theme || 'default';
    document.title = `${import.meta.env.DEV ? "[DEV] " : ""}${config.app.HtmlDocumentTitle || "Management UI"}`;

    const key = `../../../plugins/themes/${themeName}.css`;
    const loader = themeModules[key];

    if (loader) {
      loader()
        .catch(() => import('../../../plugins/themes/default.css'));
    } else if (themeName !== 'default') {
      import('../../../plugins/themes/default.css');
    }


  }, [config]);

  // If config is not ready, show a loading state
  if (isLoading) return (<AppLoader >Loading configuration...</AppLoader>);

  return (
    <PluginInitializer config={config}>
      <AppProviders router={router} />
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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppContainer />
  </React.StrictMode>,
)
