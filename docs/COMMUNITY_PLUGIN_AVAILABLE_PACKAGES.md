# Available Packages for Community Plugins

**Important:** Community plugins can only import from packages listed here. All other dependencies must be bundled with your plugin.

## Core Packages (Always Available)

These packages are provided by the host application and should **NOT** be bundled:

### React Ecosystem
- `react` - React library
- `react-dom` - React DOM renderer
- `react/jsx-runtime` - JSX runtime

### Workspace Packages
- `@oc-mui/plugin-system` - Plugin system API
- `@oc-mui/ui/components` - UI component library (shadcn/ui)
- `@oc-mui/ui/components/icons` - UI icons (e.g. Home, Video, ExternalLink)
- `@oc-mui/ui/lib` - UI lib (e.g. resolveFirstAssetUrl)
- `@oc-mui/ui/lib/utils` - UI utilities (e.g. cn)
- `@oc-mui/query` - GraphQL query hooks and client
- `@oc-mui/router` - Routing utilities
- `@oc-mui/utils` - Utility functions (e.g. logger, sha256)
- `@oc-mui/i18n` - Internationalization

### External Libraries
- `lucide-react` - Icon library (used by UI components)

## How to Use

### ✅ Correct Usage

```typescript
// These imports work - packages are provided by host
import { Button, Card } from "@oc-mui/ui/components";
import { Home, Video } from "@oc-mui/ui/components/icons";
import { cn } from "@oc-mui/ui/lib/utils";
import { resolveFirstAssetUrl } from "@oc-mui/ui/lib";
import { useGetMyEventsQuery } from "@oc-mui/query";
import { logger } from "@oc-mui/utils";
import { usePluginTranslation } from "@oc-mui/i18n";
import { BarChart3 } from "lucide-react";
import { createPlugin } from "@oc-mui/plugin-system";
```

### ❌ Incorrect Usage

```typescript
// These will FAIL - packages are not available
import axios from "axios";  // ❌ Not available
import lodash from "lodash";  // ❌ Not available
import { format } from "date-fns";  // ❌ Not available

// Solution: Bundle these with your plugin or use alternatives
```

## Adding New Packages

If you need a package that's not listed:

1. **Check if it's used in `@oc-mui/ui`:**
   - Many packages used by UI components are available
   - Check `packages/ui/package.json` for dependencies

2. **Request addition:**
   - Open an issue or PR to add the package to shared modules
   - Provide justification for why it should be shared

3. **Bundle it yourself:**
   - Add the package to your plugin's `dependencies` (not `peerDependencies`)
   - It will be bundled with your plugin

## Common Patterns

### Icons
```typescript
// ✅ Use lucide-react (available)
import { BarChart3, Calendar, CheckCircle2 } from "lucide-react";

// ❌ Don't use other icon libraries (not available)
// import { Icon } from "@iconify/react";  // Not available
```

### Date Handling
```typescript
// ❌ date-fns is not available
// import { format } from "date-fns";

// ✅ Use native Date or bundle date-fns
import { format } from "date-fns";  // Must be in dependencies, not peerDependencies
```

### HTTP Requests
```typescript
// ❌ axios is not available
// import axios from "axios";

// ✅ Use @oc-mui/query hooks for GraphQL
import { useGetMyEventsQuery } from "@oc-mui/query";

// ✅ Or use native fetch for REST APIs
const response = await fetch("/api/endpoint");
```

## Error Messages

If you see an error like:
```
Failed to resolve module specifier "package-name"
```

This means:
1. The package is not in the shared modules list
2. You need to either:
   - Bundle it with your plugin (add to `dependencies`)
   - Request it be added to shared modules
   - Use an alternative that is available

## Build-Time Validation

Your `vite.config.ts` should mark these as external:

```typescript
rollupOptions: {
  external: (id) => {
    // React ecosystem
    if (id === "react" || id === "react-dom" || id.startsWith("react/")) {
      return true;
    }
    
    // Workspace packages
    if (id.startsWith("@oc-mui/") || id.includes("/packages/")) {
      return true;
    }
    
    // Available external libraries
    if (id === "lucide-react" || id.startsWith("lucide-react/")) {
      return true;
    }
    
    return false;
  },
}
```

## Checklist

Before building your plugin:

- [ ] All imports from available packages are marked as external
- [ ] Any other dependencies are in `dependencies` (will be bundled)
- [ ] No imports from unavailable packages
- [ ] Tested with the actual Management UI (not just build)

## Troubleshooting

### "Failed to resolve module specifier"

**Cause:** You're importing a package that's not in shared modules.

**Solutions:**
1. Check this list - is the package available?
2. If yes, ensure it's marked as external in `vite.config.ts`
3. If no, add it to your plugin's `dependencies` to bundle it
4. Or request it be added to shared modules

### "Module not found" at runtime

**Cause:** The package is external but not exposed by the host.

**Solutions:**
1. Verify the package is in the shared modules list above
2. Check that the Management UI has been restarted after adding new shared modules
3. Check browser console for more details

---

**Last Updated:** 2026-01-21  
**Maintained by:** Management UI Team
