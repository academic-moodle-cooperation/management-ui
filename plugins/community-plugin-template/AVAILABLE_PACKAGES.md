# Available Packages for Community Plugins

**Quick Reference:** See the [full documentation](https://github.com/opencast/management-ui/blob/main/docs/COMMUNITY_PLUGIN_AVAILABLE_PACKAGES.md) for details.

## ✅ Available Packages

### React
- `react`
- `react-dom`
- `react/jsx-runtime`

### Workspace Packages
- `@workspace/plugin-system`
- `@workspace/ui/components`
- `@workspace/query`
- `@workspace/router`
- `@workspace/i18n`
- `@workspace/utils`

### External Libraries
- `lucide-react` - Icon library

## ❌ Not Available (Bundle These Yourself)

- `axios`, `fetch` wrappers
- `lodash`, `ramda`
- `date-fns`, `moment`, `dayjs`
- `@iconify/react`, other icon libraries
- Most other npm packages

**Solution:** Add to `dependencies` (not `peerDependencies`) in `package.json` to bundle them.

## Common Errors

### "Failed to resolve module specifier"

**Cause:** Importing a package that's not available.

**Fix:**
1. Check if it's in the list above
2. If not, add it to `dependencies` to bundle it
3. Or use an alternative that is available

## Full Documentation

See: [COMMUNITY_PLUGIN_AVAILABLE_PACKAGES.md](../../docs/COMMUNITY_PLUGIN_AVAILABLE_PACKAGES.md)
