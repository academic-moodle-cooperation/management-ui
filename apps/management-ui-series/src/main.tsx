import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryProvider } from '@workspace/query';
import { ConfigProvider, defaultConfig } from '@workspace/ui-config';
import { AuthProvider, AuthInitializer } from '@workspace/router';
import App from './App';
import '@workspace/ui/globals.css';

// Simple app wrapper with basic providers for standalone series app
const AppWithProviders = () => {
  return (
    <QueryProvider>
      <ConfigProvider
        configData={defaultConfig}
        isLoading={false}
        isError={false}
        error={null}
        isFetched={true}
      >
        <AuthProvider>
          <AuthInitializer>
            <App />
          </AuthInitializer>
        </AuthProvider>
      </ConfigProvider>
    </QueryProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppWithProviders />
  </React.StrictMode>,
) 