// Export all extension point definitions (define what CAN be customized)
export * from './core/extension-points/index.js';

// Export core plugin implementations (shipped with framework)
export * from './core/implementations/index.js';

// Export core app plugins (episodes, series, upload navigation)
export * from './core/apps/index.js';

// Export university implementations (production)
export * from './univie/implementations/index.js';
export * from './tuwien/implementations/index.js';

// Export university apps (production)
export * from './tuwien/apps/index.js';

// Export example university implementations (for development and learning)
export * from './example-university/implementations/index.js';

// Export individual examples
export { universityHeaderExample } from './example-university/implementations'; 