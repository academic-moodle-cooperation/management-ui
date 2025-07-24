import React from 'react';
import ReactDOM from 'react-dom/client';
// import { QueryProvider } from '@workspace/query';
// import { ConfigProvider, defaultConfig } from '@workspace/ui-config';
// import { AuthProvider, AuthInitializer } from '@workspace/router';
// import { PluginProvider } from '@workspace/plugin-system';
import App from './App';
import '@workspace/ui/globals.css';

// Upload app wrapper with basic providers including plugin system
// const AppWithProviders = () => {
//   return (
//     <QueryProvider>
//       <ConfigProvider
//         configData={defaultConfig}
//         isLoading={false}
//         isError={false}
//         error={null}
//         isFetched={true}
//       >
//         <AuthProvider>
//           <AuthInitializer>
//             <PluginProvider>
//               <App />
//             </PluginProvider>
//           </AuthInitializer>
//         </AuthProvider>
//       </ConfigProvider>
//     </QueryProvider>
//   );
// };

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
) 