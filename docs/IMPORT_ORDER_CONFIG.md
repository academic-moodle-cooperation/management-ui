# Import Order Configuration

**Date:** 2026-01-13  
**Status:** ✅ ACTIVE

## Summary

The import order ESLint rule is **already configured and active** in the codebase. The rule enforces consistent import ordering across all TypeScript/JavaScript files.

## Configuration

**Location:** `packages/eslint-config/base.js`

The import order rule is configured with the following settings:

```javascript
"import/order": [
  "error",
  {
    groups: [
      "builtin",      // Node.js built-in modules (e.g., 'fs', 'path')
      "external",     // External npm packages (e.g., 'react', 'lodash')
      "internal",     // Internal workspace packages (e.g., '@workspace/ui')
      "parent",       // Parent directory imports (e.g., '../utils')
      "sibling",      // Same directory imports (e.g., './component')
      "index",        // Index file imports (e.g., './index')
      "type",         // Type-only imports (e.g., 'import type { ... }')
    ],
    "newlines-between": "always",  // Require blank lines between groups
    alphabetize: {
      order: "asc",                // Alphabetical order within groups
      caseInsensitive: true,       // Case-insensitive sorting
    },
    pathGroups: [
      {
        pattern: "@workspace/**",
        group: "internal",
        position: "before",         // @workspace imports come before other internal imports
      },
      {
        pattern: "@/**",
        group: "internal",
      },
    ],
    pathGroupsExcludedImportTypes: ["builtin"],
  },
],
"import/no-duplicates": "error",  // Prevent duplicate imports
```

## Import Order Rules

### 1. Group Order

Imports must be ordered in the following sequence:

1. **Built-in modules** (Node.js core modules)
2. **External packages** (npm packages)
3. **Internal workspace packages** (`@workspace/*`)
4. **Parent directory imports** (`../`)
5. **Sibling imports** (`./`)
6. **Index imports** (`./index`)
7. **Type-only imports** (`import type`)

### 2. Blank Lines

- **Required**: Blank lines between different groups
- **Not required**: Blank lines within the same group

### 3. Alphabetical Sorting

- Within each group, imports are sorted alphabetically
- Case-insensitive sorting
- `@workspace/*` imports are prioritized before other internal imports

### 4. Type Imports

Type-only imports (`import type`) are placed in a separate group at the end.

## Example

**Before (incorrect):**
```typescript
import { useState } from "react";
import type { FC } from "react";
import { Button } from "@workspace/ui/components";
import { useQuery } from "@workspace/query";
import { logger } from "../utils";
import "./styles.css";
```

**After (correct):**
```typescript
import { useState } from "react";

import { useQuery } from "@workspace/query";
import { Button } from "@workspace/ui/components";

import { logger } from "../utils";

import "./styles.css";

import type { FC } from "react";
```

## Auto-Fix

The import order can be automatically fixed using:

```bash
pnpm lint --fix
```

This will automatically reorder imports according to the configured rules.

## Current Status

- ✅ Rule is **active** and configured
- ✅ Rule is set to **"error"** level (will fail CI)
- ✅ Auto-fix is available via `--fix` flag
- ⚠️ Some files may still have import order issues (can be auto-fixed)

## Related Rules

- `import/no-duplicates`: Prevents duplicate imports (also active)
- `no-restricted-imports`: Prevents deep imports into UI internals (also active)

## References

- [eslint-plugin-import Documentation](https://github.com/import-js/eslint-plugin-import)
- `packages/eslint-config/base.js` - Configuration file
- `docs/ESLINT_DISABLE_AUDIT.md` - ESLint disable comments audit
