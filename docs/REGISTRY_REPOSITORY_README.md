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
        "@oc-mui/plugin-system": ">=1.0.0",
        "@oc-mui/ui": ">=1.0.0"
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
- `workspaceDependencies` - Version constraints for `@oc-mui/*` packages
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
   - Must use external dependencies (react, @oc-mui/*)
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
       "@oc-mui/plugin-system": ">=1.0.0"
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
- ✅ URL accessibility check
- ✅ Version format validation

**Your PR will be rejected if:**
- JSON is malformed
- Required fields are missing
- Plugin ID already exists
- Plugin URL is unreachable
- Version format is invalid

## Security

### Allowed Domains

Plugins can only be loaded from these domains:
- `cdn.jsdelivr.net` (primary CDN)
- `raw.githubusercontent.com`
- `*.github.io` (GitHub Pages)
- `127.0.0.1` (development only)

If you need to host on a different domain, contact the maintainers.

### Version Compatibility

Plugins must specify `workspaceDependencies` to ensure compatibility:

```json
{
  "workspaceDependencies": {
    "@oc-mui/plugin-system": ">=1.0.0",
    "@oc-mui/ui": ">=1.0.0"
  }
}
```

The Marketplace will warn users if their Management UI version is incompatible.

### Verified Plugins

Maintainers can mark plugins as `"verified": true` if they:
- Have been reviewed for security
- Follow best practices
- Are actively maintained
- Have proper documentation

## Categories

Choose the appropriate category for your plugin:

- **`feature`** - Adds new functionality (analytics, reporting, custom views)
- **`theme`** - Visual customization (colors, layouts, branding)
- **`integration`** - Connects to external services (LDAP, SSO, APIs)
- **`utility`** - Helper tools (exporters, formatters, validators)
- **`experimental`** - Early-stage or experimental features

## Updating Your Plugin

To update your plugin:

1. **Release a new version** of your plugin (e.g., v1.1.0)
2. **Update the entry** in `registry.json`:
   - Change `version` to the new version
   - Update `url` to point to the new version
   - Update `lastUpdated` timestamp
3. **Create a Pull Request** with the changes

Users who have your plugin installed will see an "Update Available" badge in the Marketplace.

## Removing Your Plugin

If you want to remove your plugin from the registry:

1. **Create a Pull Request** removing your plugin entry
2. **Explain why** in the PR description
3. **Note:** This won't uninstall the plugin for users who already have it installed

## Best Practices

### Plugin Naming
- Use descriptive, unique IDs (e.g., `univie-analytics` not `analytics`)
- Include your organization/author in the ID to avoid conflicts

### Descriptions
- Be clear and concise
- Mention key features
- Include use cases

### Versioning
- Follow [Semantic Versioning](https://semver.org/)
- Use format: `MAJOR.MINOR.PATCH` (e.g., `1.2.3`)

### Tags
- Use relevant, searchable tags
- Don't over-tag (3-5 tags is usually enough)
- Use common terms users might search for

### Documentation
- Link to your plugin's README in `repositoryUrl`
- Provide clear installation instructions
- Document any special requirements

## Examples

### Minimal Plugin Entry
```json
{
  "id": "simple-plugin",
  "name": "Simple Plugin",
  "description": "A simple example plugin",
  "version": "1.0.0",
  "author": { "name": "John Doe" },
  "url": "https://cdn.jsdelivr.net/gh/johndoe/simple-plugin@v1.0.0/dist/plugin.mjs",
  "category": "feature",
  "workspaceDependencies": {
    "@oc-mui/plugin-system": ">=1.0.0"
  }
}
```

### Full Plugin Entry
```json
{
  "id": "advanced-analytics",
  "name": "Advanced Analytics Dashboard",
  "description": "Comprehensive analytics and reporting for Opencast events and series",
  "version": "2.1.0",
  "author": {
    "name": "Analytics Team",
    "email": "analytics@example.com",
    "url": "https://analytics.example.com"
  },
  "url": "https://cdn.jsdelivr.net/gh/analytics-team/advanced-analytics@v2.1.0/dist/plugin.mjs",
  "category": "feature",
  "icon": "BarChart3",
  "tags": ["analytics", "dashboard", "reporting", "statistics"],
  "repositoryUrl": "https://github.com/analytics-team/advanced-analytics",
  "homepageUrl": "https://analytics.example.com",
  "license": "MIT",
  "workspaceDependencies": {
    "@oc-mui/plugin-system": ">=1.0.0",
    "@oc-mui/ui": ">=1.0.0",
    "@oc-mui/query": ">=1.0.0"
  },
  "verified": true,
  "downloads": 150,
  "rating": 4.5,
  "lastUpdated": "2026-01-21T12:00:00Z"
}
```

## Troubleshooting

### My plugin doesn't appear in the Marketplace

1. **Check the registry URL:**
   - Ensure your PR was merged
   - Wait a few minutes for cache to expire (5 minutes)

2. **Check your plugin URL:**
   - Verify it's accessible
   - Check CORS headers
   - Ensure it's from an allowed domain

3. **Check the console:**
   - Open browser DevTools
   - Look for errors in the Marketplace

### My PR was rejected

Common reasons:
- **Invalid JSON** - Check syntax
- **Missing required fields** - Review the schema
- **Duplicate ID** - Choose a unique ID
- **URL unreachable** - Ensure your plugin is hosted and accessible
- **Invalid version** - Use semantic versioning (e.g., `1.0.0`)

### How do I test my plugin before submitting?

1. **Use Developer Mode:**
   - In the Marketplace, use "Developer Mode"
   - Enter your plugin URL directly
   - Test without adding to registry

2. **Create a local registry:**
   - Fork this repo
   - Add your plugin to `registry.json`
   - Point your Management UI to your fork's raw URL

## Contributing

We welcome contributions! Please:

1. Follow the [Code of Conduct](CODE_OF_CONDUCT.md)
2. Read the [Contributing Guide](CONTRIBUTING.md)
3. Submit PRs for any improvements
4. Report issues if you find problems

## License

This registry is licensed under [MIT License](LICENSE).

Individual plugins maintain their own licenses as specified in their entries.

## Support

- **Documentation:** [Community Plugin Development Guide](https://github.com/opencast/management-ui/blob/main/docs/COMMUNITY_PLUGIN_DEVELOPMENT.md)
- **Template:** [Community Plugin Template](https://github.com/opencast/community-plugin-template)
- **Issues:** [GitHub Issues](https://github.com/opencast/management-ui-registry/issues)
- **Discussions:** [GitHub Discussions](https://github.com/opencast/management-ui-registry/discussions)

---

**Maintained by the Opencast Community**
