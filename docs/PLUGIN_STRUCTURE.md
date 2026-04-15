# Plugin Structure - Template vs. Implementation

## Overview

The plugin development follows a **template-based approach**:

1. **`plugins/community-plugin-template/`** - The reusable template (DO NOT MODIFY)
2. **`stats-dashboard-plugin/`** or **`.local-plugins/<name>/`** - A specific plugin implementation (created from template)

## Directory Structure

```
.
├── plugins/
│   └── community-plugin-template/  # ⚠️ TEMPLATE - Keep original
│       ├── src/
│       │   ├── index.ts              # Template entry point
│       │   └── views/
│       │       └── MyPluginView.tsx  # Template view
│       ├── package.json              # Template metadata
│       └── README.md                 # Template documentation
│
└── .local-plugins/<name>/ or stats-dashboard-plugin/  # ✅ IMPLEMENTATION - Your plugin
    ├── src/
    │   ├── index.ts              # Stats dashboard entry point
    │   └── views/
    │       └── StatsDashboard.tsx # Stats dashboard component
    ├── package.json              # Stats dashboard metadata
    └── README.md                 # Stats dashboard docs
```

## Creating a New Plugin

### Step 1: Copy the Template

```bash
cp -r plugins/community-plugin-template my-new-plugin
```

### Step 2: Customize

1. **Update `package.json`:**
   - Change `name`, `id`, `description`
   - Update `plugin.json` manifest

2. **Update `src/index.ts`:**
   - Change namespace
   - Register your routes/components
   - Update sidebar navigation

3. **Create your views:**
   - Replace `MyPluginView.tsx` with your component
   - Or create new components in `src/views/`

4. **Update `README.md`:**
   - Document your specific plugin

### Step 3: Build and Test

```bash
cd my-new-plugin
pnpm install
pnpm build
npx http-server dist --cors -p 5173
```

## Why This Structure?

### Benefits

1. **Template Preservation** - Template stays clean for future plugins
2. **Isolation** - Each plugin is independent
3. **Version Control** - Each plugin can have its own git repo
4. **Reusability** - Easy to create multiple plugins

### Template Files (DO NOT MODIFY)

- `plugins/community-plugin-template/src/index.ts` - Generic template
- `plugins/community-plugin-template/src/views/MyPluginView.tsx` - Example view
- `plugins/community-plugin-template/package.json` - Template metadata
- `plugins/community-plugin-template/README.md` - Template docs

### Implementation Files (CUSTOMIZE)

- `stats-dashboard-plugin/src/index.ts` - Your plugin logic
- `stats-dashboard-plugin/src/views/StatsDashboard.tsx` - Your components
- `stats-dashboard-plugin/package.json` - Your metadata
- `stats-dashboard-plugin/README.md` - Your documentation

## Current Plugins

### Statistics Dashboard

- **Location:** `stats-dashboard-plugin/`
- **Purpose:** Display Opencast event statistics
- **Status:** ✅ Ready for testing

## Best Practices

1. **Always copy the template** - Never modify it directly
2. **Use descriptive names** - Plugin directory should match plugin ID
3. **Keep it isolated** - Each plugin is independent
4. **Document well** - Update README with plugin-specific info
5. **Version independently** - Each plugin has its own version

## Workflow

```bash
# 1. Copy template
cp -r plugins/community-plugin-template my-plugin

# 2. Customize
cd my-plugin
# Edit files...

# 3. Build
pnpm install
pnpm build

# 4. Test
npx http-server dist --cors -p 5173

# 5. Distribute
# Push to GitHub, create release, add to registry
```

---

**Remember:** The template is for copying, not modifying! 🎯
