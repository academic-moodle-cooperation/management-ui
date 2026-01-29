# Community Plugins - Next Steps & Status

**Date:** 2026-01-21  
**Status:** Core Implementation Complete ✅ | Local Registry for Dev ✅ | External Registry Repo Optional

## ✅ What's Already Done

### Core Implementation (Complete)
1. **Plugin Loading System** ✅
   - `RemoteLoader` with module transformation
   - Shared modules exposure (`window.__SHARED_MODULES__`)
   - GraphQL fragment auto-registration
   - Security validation (URL allowlist, version checking)
   - Plugin persistence (localStorage)

2. **Marketplace UI** ✅
   - Community plugins browsing
   - Search and filtering
   - Install/Uninstall/Try functionality
   - Developer Mode for custom URLs
   - Table and card view modes (with persistence)
   - Pending changes notifications

3. **Registry Fetcher** ✅
   - Multi-registry support (public + private)
   - **In dev: tries local `public/registry.json` first** (no external repo required for testing)
   - Caching (5-minute TTL)
   - Deduplication
   - Update checking
   - Error handling

4. **Local registry for development** ✅
   - `apps/management-ui-core/public/registry.json` — sample registry (add plugin entries here to test Marketplace)
   - In DEV, the fetcher uses this file first; production still uses configured registry URL(s)

5. **Documentation** ✅
   - Community Plugin Development Guide
   - Template repository structure
   - Build configuration examples

## What's Next (A4: Community Distribution)

### Option A: Keep Using Local Registry (Testing / Single Instance)
- Edit `apps/management-ui-core/public/registry.json`: add entries with `id`, `name`, `description`, `version`, `author`, `url` (to `.mjs`), `category`, `workspaceDependencies`.
- Build your plugin, serve the `dist/` (e.g. via CDN or same host), point `url` to the bundle.
- Open Admin → Marketplace; install from the list.

### Option B: Create the Official Registry Repository (Production / Community)
**Current default URL (used when no registry URLs are configured):**
```
https://raw.githubusercontent.com/opencast/management-ui-registry/main/registry.json
```
**That repository may not exist yet.** To enable community distribution:

#### Option A: Create the Official Registry Repository

1. **Create GitHub Repository:**
   ```bash
   # Create: opencast/management-ui-registry (or your org)
   # Make it public
   # Add a README explaining the registry format
   ```

2. **Create Initial `registry.json`:**
   ```json
   {
     "version": "1.0.0",
     "name": "Opencast Management UI Community Plugin Registry",
     "description": "Official registry for community-developed plugins",
     "plugins": [
       {
         "id": "example-plugin",
         "name": "Example Plugin",
         "description": "An example plugin to demonstrate the registry",
         "version": "1.0.0",
         "author": {
           "name": "Example Author",
           "url": "https://example.com"
         },
         "url": "https://cdn.jsdelivr.net/gh/org/repo@v1.0.0/dist/plugin.mjs",
         "category": "feature",
         "workspaceDependencies": {
           "@workspace/plugin-system": ">=1.0.0"
         },
         "tags": ["example", "demo"],
         "verified": false
       }
     ]
   }
   ```

3. **Add GitHub Actions for Validation:**
   - Create `.github/workflows/validate.yml` (see `docs/registry-repo-contents/.github/workflows/validate.yml` for an example)
   - Validate JSON schema
   - Check plugin URLs are accessible
   - Prevent duplicate IDs

#### Local registry (already set up)
- In development, the fetcher **already tries** `public/registry.json` first (see `registry-fetcher.ts`).
- Edit `apps/management-ui-core/public/registry.json` and add plugin entries to test the Marketplace without an external repo.
- Example entry:
  ```json
  {
    "id": "my-org-plugin",
    "name": "My Org Plugin",
    "description": "Local test plugin",
    "version": "1.0.0",
    "author": { "name": "You" },
    "url": "http://127.0.0.1:3000/management-ui/local-plugins/my-org-plugin/my-plugin.mjs",
    "category": "feature",
    "workspaceDependencies": { "@workspace/plugin-system": ">=1.0.0" }
  }
  ```
  (Use a URL that serves your plugin bundle — e.g. local-plugins dev server or a CDN.)

### 2. Configure Registry URLs (Optional Enhancement)

**Current Status:** Registry URLs are hardcoded. You can add configuration support:

#### Option A: Environment Variables
```typescript
// In registry-fetcher.ts initialization
const REGISTRY_URLS = import.meta.env.VITE_PLUGIN_REGISTRIES
  ? import.meta.env.VITE_PLUGIN_REGISTRIES.split(',').map(url => url.trim())
  : [];
```

#### Option B: Config File
Create `public/plugin-registries.json`:
```json
{
  "registries": [
    "https://raw.githubusercontent.com/opencast/management-ui-registry/main/registry.json",
    "https://your-internal-registry.example.com/registry.json"
  ]
}
```
Replace the second URL with your organization's private registry if needed. Then load it in the marketplace initialization.

### 3. Test the Complete Flow

1. **Build a test plugin:**
   ```bash
   cd plugins/community-plugin-template
   pnpm install
   pnpm build
   ```

2. **Serve the plugin:**
   ```bash
   npx http-server dist --cors -p 5173
   ```

3. **Create local registry:**
   - Add entry to `public/registry.json` pointing to `http://127.0.0.1:5173/my-plugin.mjs`

4. **Test in Marketplace:**
   - Open Admin > Marketplace
   - Should see your test plugin in "Community Plugins" section
   - Try installing it

### 4. Migration Tasks (From Implementation Plan)

#### Phase 4: Migrate univie/tuwien (Done)
- [x] Remove `plugins/univie/` and `plugins/tuwien/` from main repository (open-source core kept clean)
- [x] Org themes (`univie.css`, `tuwien.css`) removed from `plugins/themes/`; use `.local-plugins/<name>/themes/` in dev
- [ ] Optional: Export as separate repositories and publish to CDN / registry
- **To use univie/tuwien locally:** Copy from git history or a backup into `.local-plugins/univie/` and `.local-plugins/tuwien/` (each with `themes/<name>.css`). Build and run core in dev; plugins and themes load from `.local-plugins/`.

#### Phase 5: Marketplace Enhancements (Optional)
- [ ] Plugin details page
- [ ] Update notifications
- [ ] Ratings/Reviews
- [ ] Download statistics

## Current Registry Behavior

The `RegistryFetcher` service:

1. **Fetches from:** `DEFAULT_COMMUNITY_REGISTRY` if no URLs configured
2. **Falls back gracefully:** If registry fetch fails, shows empty list (no crash)
3. **Caches results:** 5-minute TTL to reduce API calls
4. **Supports multiple registries:** Can merge plugins from multiple sources
5. **Deduplicates:** Later registries override earlier ones (by plugin ID)

## Testing Checklist

- [ ] Create registry repository OR local registry file
- [ ] Test registry fetch (should load plugins)
- [ ] Test plugin installation from registry
- [ ] Test plugin updates (version comparison)
- [ ] Test multiple registries (if configured)
- [ ] Test error handling (invalid registry URL)
- [ ] Test caching (refresh should use cache)

## Quick Start: Local Testing

1. **Create local registry:**
   ```bash
   echo '{
     "version": "1.0.0",
     "plugins": [{
       "id": "my-test-plugin",
       "name": "My Test Plugin",
       "description": "Testing the registry",
       "version": "1.0.0",
       "author": { "name": "You" },
       "url": "http://127.0.0.1:5173/my-plugin.mjs",
       "category": "feature",
       "workspaceDependencies": { "@workspace/plugin-system": ">=1.0.0" }
     }]
   }' > apps/management-ui-core/public/registry.json
   ```

2. **Update registry fetcher** (temporary, for local testing):
   ```typescript
   // In registry-fetcher.ts, line 236:
   if (allUrls.length === 0) {
     // For local testing, use local registry
     allUrls.push('/registry.json');
     // allUrls.push(DEFAULT_COMMUNITY_REGISTRY); // Comment out for now
   }
   ```

3. **Build and serve a test plugin:**
   ```bash
   cd plugins/community-plugin-template
   pnpm build
   npx http-server dist --cors -p 5173
   ```

4. **Test in UI:**
   - Start the Management UI
   - Go to Admin > Marketplace
   - Your test plugin should appear in "Community Plugins"

## Summary

**You're almost done!** The core implementation is complete. The main missing piece is:

1. **Create the registry repository** (or use local registry for testing)
2. **Add some test plugins** to the registry
3. **Test the complete flow**

The code is already trying to load the registry - it just needs the registry file to exist at the configured URL.
