# Complete Plugin Development Workflow: Statistics Dashboard

This guide walks you through the complete lifecycle of developing, testing, and distributing a community plugin using the Statistics Dashboard as an example.

## Step 1: Development Setup

### 1.1 Navigate to Template

```bash
cd plugins/community-plugin-template
```

### 1.2 Install Dependencies

```bash
pnpm install
```

### 1.3 Verify Structure

Your plugin should have:
```
plugins/community-plugin-template/
├── src/
│   ├── index.ts              # Plugin entry point
│   └── views/
│       └── StatsDashboard.tsx  # Main component
├── package.json              # Plugin metadata
├── vite.config.ts            # Build configuration
└── README.md                 # Documentation
```

## Step 2: Development & Testing

### 2.1 Build in Watch Mode

```bash
pnpm dev
```

This watches for changes and rebuilds automatically.

### 2.2 Serve the Plugin Locally

In a **new terminal**:

```bash
# From plugins/community-plugin-template directory
npx http-server dist --cors -p 5173
```

Your plugin is now available at:
```
http://127.0.0.1:5173/stats-dashboard.mjs
```

### 2.3 Test in Management UI

1. **Start the Management UI:**
   ```bash
   cd apps/management-ui-core
   pnpm dev
   ```

2. **Open the Marketplace:**
   - Navigate to: `http://127.0.0.1:3000/admin/marketplace`
   - Scroll to "Developer Mode" section

3. **Load Your Plugin:**
   - Enter URL: `http://127.0.0.1:5173/stats-dashboard.mjs`
   - Click "Try" to test temporarily
   - Or click "Install" to persist it

4. **Verify It Works:**
   - Check browser console for any errors
   - Navigate to the Statistics Dashboard from sidebar
   - Verify statistics are loading and displaying

### 2.4 Debugging Tips

- **Check Browser Console:** Look for errors or warnings
- **Network Tab:** Verify API calls to `/admin-ng/resources/STATS.json`
- **React DevTools:** Inspect component state
- **Force Reload:** Use "Force reload (bypass cache)" checkbox in Developer Mode

## Step 3: Production Build

### 3.1 Build for Production

```bash
pnpm build
```

This creates:
- `dist/stats-dashboard.mjs` - The plugin bundle
- `dist/stats-dashboard.mjs.map` - Source map for debugging

### 3.2 Verify Build Output

```bash
ls -lh dist/
```

You should see:
- `stats-dashboard.mjs` (~50-100KB typically)
- `stats-dashboard.mjs.map` (source map)

**Important:** The file should be relatively small since React and workspace packages are external.

## Step 4: Distribution Preparation

### 4.1 Create GitHub Repository

1. **Create a new repository:**
   - Name: `stats-dashboard-plugin` (or your choice)
   - Make it public
   - Don't initialize with README (we already have one)

2. **Push your code:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Statistics Dashboard plugin"
   git remote add origin https://github.com/your-org/stats-dashboard-plugin.git
   git push -u origin main
   ```

### 4.2 Create GitHub Release

1. **Tag the release:**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **Create GitHub Release:**
   - Go to your repository on GitHub
   - Click "Releases" → "Create a new release"
   - Tag: `v1.0.0`
   - Title: `Statistics Dashboard v1.0.0`
   - Description: Brief description of the plugin
   - Upload `dist/stats-dashboard.mjs` as a release asset (optional)

3. **Your plugin URL is now:**
   ```
   https://cdn.jsdelivr.net/gh/your-org/stats-dashboard-plugin@v1.0.0/dist/stats-dashboard.mjs
   ```

### 4.3 Test the CDN URL

1. **Verify the URL works:**
   ```bash
   curl -I https://cdn.jsdelivr.net/gh/your-org/stats-dashboard-plugin@v1.0.0/dist/stats-dashboard.mjs
   ```

   Should return `200 OK` with proper CORS headers.

2. **Test in Management UI:**
   - Use Developer Mode with the CDN URL
   - Verify it loads correctly

## Step 5: Register in Plugin Registry

### 5.1 Fork the Registry Repository

1. Go to: https://github.com/eduardklinger/management-ui-registry
2. Click "Fork" to create your own copy

### 5.2 Add Your Plugin Entry

1. **Clone your fork:**
   ```bash
   git clone https://github.com/your-username/management-ui-registry.git
   cd management-ui-registry
   ```

2. **Edit `registry.json`:**
   ```json
   {
     "version": "1.0.0",
     "plugins": [
       {
         "id": "stats-dashboard",
         "name": "Statistics Dashboard",
         "description": "Beautiful animated dashboard displaying Opencast event statistics",
         "version": "1.0.0",
         "author": {
           "name": "Your Name",
           "url": "https://github.com/your-username"
         },
         "url": "https://cdn.jsdelivr.net/gh/your-org/stats-dashboard-plugin@v1.0.0/dist/stats-dashboard.mjs",
         "category": "feature",
         "icon": "BarChart3",
         "tags": ["dashboard", "statistics", "analytics", "events"],
         "repositoryUrl": "https://github.com/your-org/stats-dashboard-plugin",
         "workspaceDependencies": {
           "@oc-mui/plugin-system": ">=1.0.0",
           "@oc-mui/ui": ">=1.0.0",
           "@oc-mui/query": ">=1.0.0"
         },
         "verified": false
       }
     ]
   }
   ```

3. **Commit and push:**
   ```bash
   git add registry.json
   git commit -m "Add stats-dashboard plugin"
   git push origin main
   ```

### 5.3 Create Pull Request

1. Go to the original repository: https://github.com/eduardklinger/management-ui-registry
2. Click "Pull Requests" → "New Pull Request"
3. Select your fork as the source
4. Fill in the PR description:
   - Plugin name and description
   - What it does
   - Link to your repository
5. Submit the PR

### 5.4 Wait for Validation

The GitHub Action will automatically:
- ✅ Validate JSON syntax
- ✅ Check for duplicate IDs
- ✅ Verify the plugin URL is accessible
- ✅ Validate version format

If validation passes, maintainers will review and merge.

## Step 6: Update Your Plugin

When you want to release a new version:

### 6.1 Update Version

1. **Update `plugin.json` and `package.json`:**
   ```json
   {
     "version": "1.1.0"
   }
   ```

2. **Rebuild:**
   ```bash
   pnpm build
   ```

3. **Commit and tag:**
   ```bash
   git add .
   git commit -m "Release v1.1.0"
   git tag v1.1.0
   git push origin main --tags
   ```

### 6.2 Update Registry Entry

1. **Update `registry.json` in your fork:**
   - Change `version` to `"1.1.0"`
   - Update `url` to point to new version
   - Update `lastUpdated` timestamp

2. **Create a new PR** with the update

Users who have your plugin installed will see an "Update Available" badge in the Marketplace.

## Step 7: Troubleshooting

### Plugin Doesn't Load

**Check:**
- ✅ URL is accessible (test with `curl`)
- ✅ CORS headers are present
- ✅ File is actually an ES module
- ✅ No console errors

**Common Issues:**
- **CORS Error:** Ensure your server/CDN sends proper CORS headers
- **404 Error:** Verify the URL path is correct
- **Module Error:** Check that the file exports a default plugin object

### Plugin Loads But UI Doesn't Appear

**Check:**
- ✅ Plugin registered routes correctly
- ✅ Sidebar item has correct permissions
- ✅ No errors in browser console
- ✅ Route path doesn't conflict with existing routes

### Statistics Don't Load

**Check:**
- ✅ Opencast backend is running
- ✅ `/admin-ng/resources/STATS.json` endpoint exists
- ✅ User has proper permissions
- ✅ Network tab shows the API call

## Quick Reference

### Development Commands

```bash
# Install dependencies
pnpm install

# Build in watch mode
pnpm dev

# Build for production
pnpm build

# Type check
pnpm typecheck

# Lint
pnpm lint
```

### Testing URLs

- **Local Plugin:** `http://127.0.0.1:5173/stats-dashboard.mjs`
- **CDN Plugin:** `https://cdn.jsdelivr.net/gh/org/repo@v1.0.0/dist/stats-dashboard.mjs`
- **Marketplace:** `http://127.0.0.1:3000/admin/marketplace`

### Key Files

- `src/index.ts` - Plugin registration
- `src/views/StatsDashboard.tsx` - Main component
- `package.json` - Plugin metadata
- `vite.config.ts` - Build configuration
- `dist/stats-dashboard.mjs` - Built plugin (after build)

## Next Steps

1. ✅ **Test locally** - Use Developer Mode
2. ✅ **Build for production** - Create optimized bundle
3. ✅ **Host on CDN** - Use GitHub Releases + jsDelivr
4. ✅ **Register in registry** - Submit PR to registry repo
5. ✅ **Share with community** - Your plugin is now discoverable!

---

**Congratulations!** You've successfully created, tested, and distributed a community plugin! 🎉
