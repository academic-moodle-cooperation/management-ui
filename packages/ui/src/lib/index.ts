// File: packages/ui/src/lib/index.ts
// This file serves as the public API for lib utilities available via '@opencast-mui/ui/lib'.

export * from "./utils"; // Exporting all from utils.ts
// Re-export from @opencast-mui/utils for convenience
export { resolveAssetUrl, resolveFirstAssetUrl } from "@opencast-mui/utils";

// TODO: If more utility files are added to src/lib, export them here.
