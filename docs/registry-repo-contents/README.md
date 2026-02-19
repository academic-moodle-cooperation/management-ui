# Opencast Management UI Plugin Registry

**Official registry for community-developed plugins for the Opencast Management UI.**

This repository contains a centralized registry (`registry.json`) that lists all available community plugins. The Management UI Marketplace fetches this registry to display available plugins that users can install.

## What is This?

The Management UI supports **Community Plugins** - externally developed plugins that can be loaded dynamically at runtime. This registry serves as the central directory where plugin developers can register their plugins to make them discoverable in the Marketplace.

## Registry Format

The `registry.json` file follows this structure:

```json
{
  "version": "1.0.0",
  "name": "Opencast Management UI Community Plugin Registry",
  "description": "Official registry for community-developed plugins",
  "lastUpdated": "2026-01-21T12:00:00Z",
  "plugins": [
    {
      "id": "unique-plugin-id",
      "name": "Plugin Display Name",
      "description": "What this plugin does",
      "version": "1.0.0",
      "author": {
        "name": "Author Name",
        "email": "author@example.com",
        "url": "https://author-website.com"
      },
      "url": "https://cdn.jsdelivr.net/gh/org/repo@v1.0.0/dist/plugin.mjs",
      "category": "feature",
      "icon": "Star",
      "tags": ["analytics", "dashboard"],
      "repositoryUrl": "https://github.com/org/repo",
      "homepageUrl": "https://plugin-website.com",
      "license": "MIT",
      "workspaceDependencies": {
        "@workspace/plugin-system": ">=1.0.0",
        "@workspace/ui": ">=1.0.0"
      },
      "verified": false,
      "downloads": 0,
      "rating": 0,
      "lastUpdated": "2026-01-21T12:00:00Z"
    }
  ]
}
```

### Required Fields

- `id` - Unique identifier (lowercase, alphanumeric, hyphens allowed)
- `name` - Display name
- `description` - Brief description
- `version` - Semantic version (e.g., "1.0.0")
- `author.name` - Author's name
- `url` - Direct URL to the plugin bundle (.mjs file)
- `category` - One of: `"feature"`, `"theme"`, `"integration"`, `"utility"`, `"experimental"`

### Optional Fields

- `author.email` - Author email
- `author.url` - Author website
- `icon` - Lucide React icon name
- `tags` - Array of searchable tags
- `repositoryUrl` - GitHub/GitLab repository URL
- `homepageUrl` - Plugin homepage
- `license` - License identifier (MIT, Apache-2.0, etc.)
- `workspaceDependencies` - Version constraints for `@workspace/*` packages
- `verified` - Whether plugin is verified by maintainers (default: `false`)
- `downloads` - Download count (for statistics)
- `rating` - Rating (0-5)
- `lastUpdated` - ISO 8601 timestamp

## Adding Your Plugin

### Prerequisites

1. **Your plugin must be built and hosted:**
   - Build your plugin using the [community plugin template](https://github.com/opencast/community-plugin-template)
   - Host it on a CDN (recommended: jsDelivr via GitHub Releases)
   - Ensure the URL is accessible and CORS-enabled

2. **Your plugin must follow the format:**
   - Must export a default plugin object
   - Must use external dependencies (react, @workspace/*)
   - Must be an ES module (.mjs)

### Steps to Add Your Plugin

1. **Fork this repository**

2. **Add your plugin entry to `registry.json`:**
   ```json
   {
     "id": "my-awesome-plugin",
     "name": "My Awesome Plugin",
     "description": "Does awesome things",
     "version": "1.0.0",
     "author": {
       "name": "Your Name",
       "url": "https://your-website.com"
     },
     "url": "https://cdn.jsdelivr.net/gh/your-org/your-plugin@v1.0.0/dist/plugin.mjs",
     "category": "feature",
     "workspaceDependencies": {
       "@workspace/plugin-system": ">=1.0.0"
     }
   }
   ```

3. **Create a Pull Request:**
   - Title: `Add plugin: [plugin-name]`
   - Description: Brief description of what your plugin does
   - The GitHub Action will automatically validate your entry

4. **Wait for review:**
   - Maintainers will review your PR
   - They'll verify the plugin URL is accessible
   - Once merged, your plugin will appear in the Marketplace

### Plugin URL Requirements

Your plugin URL must:
- Be accessible via HTTPS (or HTTP for 127.0.0.1 in development)
- Be from an allowed domain (see Security section)
- Return a valid ES module
- Have proper CORS headers

**Recommended hosting:**
- **jsDelivr CDN** (via GitHub Releases): `https://cdn.jsdelivr.net/gh/org/repo@v1.0.0/dist/plugin.mjs`
- **GitHub Pages**: `https://username.github.io/repo/dist/plugin.mjs`
- **Your own CDN**: Must be HTTPS and allowlisted

## Validation

Every Pull Request is automatically validated by GitHub Actions:

- ✅ JSON schema validation
- ✅ Required fields check
- ✅ Unique plugin ID check
- ✅ URL accessibility check (unless `SKIP_URL_CHECK=1` in workflow)
- ✅ Version format validation

**Your PR will be rejected if:**
- JSON is malformed
- Required fields are missing
- Plugin ID already exists
- Plugin URL is unreachable (when URL check is enabled)
- Version format is invalid

## Security

### Allowed Domains

Plugins can only be loaded from domains allowlisted by the Management UI (e.g. `cdn.jsdelivr.net`, `*.github.io`, `127.0.0.1` for development). See the Management UI documentation for the current list.

### Version Compatibility

Plugins should specify `workspaceDependencies` to ensure compatibility with the host:

```json
{
  "workspaceDependencies": {
    "@workspace/plugin-system": ">=1.0.0",
    "@workspace/ui": ">=1.0.0"
  }
}
```

The Marketplace will warn users if their Management UI version is incompatible.

## Categories

- **`feature`** - Adds new functionality (analytics, reporting, custom views)
- **`theme`** - Visual customization (colors, layouts, branding)
- **`integration`** - Connects to external services (LDAP, SSO, APIs)
- **`utility`** - Helper tools (exporters, formatters, validators)
- **`experimental`** - Early-stage or experimental features

## Updating Your Plugin

1. Release a new version of your plugin (e.g. v1.1.0)
2. Update the entry in `registry.json` (version, url, lastUpdated)
3. Open a Pull Request

## Removing Your Plugin

Open a Pull Request removing your plugin entry. This does not uninstall the plugin for users who already have it installed.

## License

This registry is licensed under [MIT License](LICENSE). Individual plugins maintain their own licenses.

## Support

- **Documentation:** [Community Plugin Development Guide](https://github.com/opencast/management-ui/blob/main/docs/COMMUNITY_PLUGIN_DEVELOPMENT.md)
- **Template:** [Community Plugin Template](https://github.com/opencast/community-plugin-template)

---

**Maintained by the Opencast Community**
