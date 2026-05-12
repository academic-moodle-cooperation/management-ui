# Community Plugin Dependency Management

## Problem

Community plugins can only import from packages that are:
1. Exposed via `window.__SHARED_MODULES__` in the host application (`apps/management-ui-core/src/shared/sharedModules.ts`)
2. Listed in `SHARED_MODULE_NAMES` in `packages/remote-plugin-loader/src/transform.ts`
3. Marked as `external` in the plugin's `vite.config.ts`

If a plugin tries to import a package that's not available, it fails with:
```
Failed to resolve module specifier "package-name"
```

## Solution Approach

We've implemented a **multi-layered approach** to prevent and handle this issue:

### 1. ✅ Proactive Package Addition

**What we did:**
- Added `lucide-react` to shared modules (it's commonly used)
- Documented all available packages clearly

**When to add more:**
- If a package is used by multiple plugins
- If it's a core dependency of `@oc-mui/ui` (like `lucide-react`)
- If it's essential for plugin development

**How to add:**
1. Add import to `apps/management-ui-core/src/shared/sharedModules.ts`
2. Add to `SharedModuleRegistry` interface and `window.__SHARED_MODULES__` object
3. Add to `SHARED_MODULE_NAMES` in `packages/remote-plugin-loader/src/transform.ts`
4. Add to the "available" list in `packages/remote-plugin-loader/src/loadAndRegister.ts` (error message)
5. Update `docs/COMMUNITY_PLUGIN_AVAILABLE_PACKAGES.md`

### 2. ✅ Better Error Messages

**What we did:**
- Enhanced error handling in `@oc-mui/remote-plugin-loader` (`loadAndRegister.ts`)
- Detects module resolution errors
- Provides helpful guidance with links to documentation
- Suggests solutions (bundle it, or request addition)

**Error message example:**
```
Module "package-name" is not available. 
Available packages: react, react-dom, lucide-react, @oc-mui/plugin-system, @oc-mui/ui/components, @oc-mui/ui/components/icons, @oc-mui/ui/lib, @oc-mui/ui/lib/utils, @oc-mui/query, @oc-mui/router, @oc-mui/utils, @oc-mui/i18n. See docs/COMMUNITY_PLUGIN_AVAILABLE_PACKAGES.md for the full list.
See https://github.com/.../COMMUNITY_PLUGIN_AVAILABLE_PACKAGES.md for details.
If you need "package-name", add it to your plugin's dependencies to bundle it.
```

### 3. ✅ Comprehensive Documentation

**What we created:**
- `docs/COMMUNITY_PLUGIN_AVAILABLE_PACKAGES.md` - Complete reference
- `plugins/community-plugin-template/AVAILABLE_PACKAGES.md` - Quick reference
- Updated main development guide with warnings
- Updated template README

**Key sections:**
- ✅ Available packages list
- ❌ Not available packages
- Common patterns and examples
- Troubleshooting guide
- Build-time validation checklist

### 4. ✅ Build-Time Validation (Template)

**What's in the template:**
- `vite.config.ts` already has correct `external` configuration
- Includes `lucide-react` in externals
- Clear comments explaining what should be external

**Developers should:**
- Check the template's `vite.config.ts` as reference
- Ensure any new externals match the available packages list

## Workflow for Plugin Developers

### Step 1: Check Available Packages

Before importing any package:
1. Read `AVAILABLE_PACKAGES.md` in the template
2. Or check `docs/COMMUNITY_PLUGIN_AVAILABLE_PACKAGES.md`

### Step 2: Configure Vite

Ensure `vite.config.ts` marks available packages as external:

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

### Step 3: Handle Unavailable Packages

If you need a package that's not available:

**Option A: Bundle it**
```json
{
  "dependencies": {
    "date-fns": "^2.30.0"  // Will be bundled with your plugin
  }
}
```

**Option B: Request addition**
- Open an issue/PR to add it to shared modules
- Provide justification

**Option C: Use alternative**
- Use a package that is available
- Or use native browser APIs

## Current Available Packages

### Core
- `react`, `react-dom`, `react/jsx-runtime`

### Workspace
- `@oc-mui/plugin-system`
- `@oc-mui/ui/components`
- `@oc-mui/query`
- `@oc-mui/router`
- `@oc-mui/i18n`
- `@oc-mui/utils`

### External
- `lucide-react` (icons)

## Future Considerations

### Should We Add More Packages?

**Pros:**
- Easier for developers
- Smaller plugin bundles
- Consistent versions

**Cons:**
- Larger host application
- Version conflicts
- Maintenance burden

### Recommendation

**Add packages when:**
- ✅ Used by multiple plugins
- ✅ Core to the UI system (like `lucide-react`)
- ✅ Small and stable
- ✅ Requested by multiple developers

**Don't add when:**
- ❌ Only used by one plugin
- ❌ Large or frequently updated
- ❌ Has many dependencies
- ❌ Can be easily bundled

### Examples

**Good candidates:**
- `lucide-react` ✅ (already added - used everywhere)
- Maybe `date-fns`? (if many plugins need date formatting)

**Not good candidates:**
- `axios` (can use native `fetch`)
- `lodash` (large, can use alternatives)
- `chart.js` (only needed by specific plugins)

## Developer Experience Improvements

### What We've Done ✅

1. **Clear documentation** - Developers know what's available
2. **Better errors** - Helpful messages guide developers
3. **Template configured** - New plugins start with correct setup
4. **Quick reference** - Easy to check available packages

### What Could Be Improved (Future)

1. **Build-time validation script**
   - Check imports against available packages
   - Warn during `pnpm build` if using unavailable packages

2. **TypeScript types**
   - Generate types for available packages
   - Better autocomplete and errors

3. **Plugin validator**
   - Validate plugin before publishing
   - Check for common mistakes

4. **Auto-detection**
   - Scan plugin source for imports
   - Warn about potential issues

## Summary

**Current State:**
- ✅ `lucide-react` added to shared modules
- ✅ Comprehensive documentation
- ✅ Better error messages
- ✅ Template properly configured

**For Developers:**
- ✅ Check available packages before importing
- ✅ Bundle unavailable packages if needed
- ✅ Read error messages for guidance
- ✅ Use template as reference

**For Maintainers:**
- ✅ Add packages when justified (multiple use cases)
- ✅ Keep documentation updated
- ✅ Monitor common requests

---

**This approach balances:**
- Developer experience (clear docs, helpful errors)
- Flexibility (developers can bundle what they need)
- Maintainability (don't bloat shared modules)
