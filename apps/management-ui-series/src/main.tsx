import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryProvider } from '@workspace/query';
import { AuthProvider, AuthInitializer } from '@workspace/router';
import App from './App';
import '@workspace/ui/globals.css';

// Simple app wrapper with basic providers for standalone series app
const AppWithProviders = () => {
  return (
    <QueryProvider>
      <AuthProvider>
        <AuthInitializer>
          <App />
        </AuthInitializer>
      </AuthProvider>
    </QueryProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppWithProviders />
  </React.StrictMode>,
) 