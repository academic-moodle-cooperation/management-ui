// File: packages/ui/src/index.ts
// Main entry point for the @workspace/ui package.

// Option 1: Re-export everything for maximum convenience (can be less tree-shakeable for consumers if not careful)
// export * from './components'; // Already handled by './components' export in package.json
// export * from './hooks';      // Already handled by './hooks' export in package.json
// export * from './lib';        // Already handled by './lib' export in package.json

// Option 2: Selective exports. Only export what should be available directly from '@workspace/ui'.
// Most imports will use subpaths like '@workspace/ui/components' or '@workspace/ui/lib'.

// Example: Exporting a very common utility like 'cn' if it exists in lib/utils.ts and is exported from lib/index.ts
// export { cn } from './lib'; // This assumes 'cn' is exported from './lib/index.ts'

// For now, keeping this minimal. Users will primarily use subpath exports.
// Add any truly top-level exports here if needed.
