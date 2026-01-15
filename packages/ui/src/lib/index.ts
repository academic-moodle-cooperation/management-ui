// File: packages/ui/src/lib/index.ts
// This file serves as the public API for lib utilities available via '@workspace/ui/lib'.

export * from "./utils"; // Exporting all from utils.ts
// Re-export from @workspace/utils for convenience
export { resolveAssetUrl, resolveFirstAssetUrl } from "@workspace/utils";

// TODO: If more utility files are added to src/lib, export them here.
