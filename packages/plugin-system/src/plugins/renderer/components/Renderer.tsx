// import React, { useEffect } from 'react';
// import { usePluginManager } from '../../../PluginProvider';
// import { RendererComponent } from '../types';

// /**
//  * @deprecated Use ComponentResolver instead. Renderer will be removed in a future version.
//  */
// export const Renderer: React.FC<{ position: string, fallback?: React.ReactNode }> = ({ position, fallback }) => {
//   const manager = usePluginManager();
//   const [components, setComponents] = React.useState<RendererComponent[]>([]);
//   const [hasError, setHasError] = React.useState(false);

//   useEffect(() => {
//     console.warn('Renderer is deprecated. Please use ComponentResolver instead.');

//     if (hasError) return;

//     try {
//       const getAndSetComponents = () => {
//         try {
//           const comps = manager.executeFunction<RendererComponent[]>('renderer.getComponents', position) || [];
//           setComponents(comps);
//         } catch (err) {
//           console.error(`Error getting components for ${position}:`, err);
//           setHasError(true);
//         }
//       };

//       getAndSetComponents();

//       const handleUpdate = (event: { position: string }) => {
//         if (event.position === position) {
//           getAndSetComponents();
//         }
//       };

//       manager.addEventListener('renderer.componentUpdated', handleUpdate);
//       return () => manager.removeEventListener('renderer.componentUpdated', handleUpdate);
//     } catch (err) {
//       console.error(`Error in Renderer effect for ${position}:`, err);
//       setHasError(true);
//     }
//   }, [manager, position, hasError]);

//   if (hasError || components.length === 0) {
//     return <>{fallback}</>;
//   }

//   return (
//     <div data-position={position}>
//       {components.map(({ component: Component, key }) => {
//         if (!Component) return null;
//         try {
//           return <Component key={key} />;
//         } catch (err) {
//           console.error(`Error rendering component ${key}:`, err);
//           return null;
//         }
//       })}
//     </div>
//   );
// };
