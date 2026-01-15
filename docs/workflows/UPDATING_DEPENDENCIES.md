# Updating Dependencies Safely

**Last Updated:** 2025-11-12

## Overview

This guide provides safe strategies for updating dependencies in the Management UI monorepo. Following these practices minimizes breaking changes and ensures system stability.

## Dependency Types

### 1. External Dependencies

Third-party packages from npm:

- React, TanStack Query, Vite, etc.
- UI libraries (Radix UI, Tailwind CSS)
- Build tools and dev dependencies

### 2. Workspace Dependencies

Internal packages (`@workspace/*`):

- Managed by pnpm workspace
- Version controlled in monorepo
- Updated together

## Pre-Update Checklist

Before updating any dependency:

- [ ] **Read the changelog** - Know what's changing
- [ ] **Check breaking changes** - Look for BREAKING CHANGE notices
- [ ] **Review migration guides** - Follow upgrade paths
- [ ] **Check coupling** - Read [COUPLING_ANALYSIS.md](/docs/COUPLING_ANALYSIS.md)
- [ ] **Identify affected packages** - Who depends on this?
- [ ] **Plan testing** - How will you verify?
- [ ] **Create backup** - Commit current working state

## Safe Update Process

### Step 1: Check Current Versions

```bash
# List outdated dependencies
pnpm outdated

# Check specific package
pnpm list [package-name]

# Check workspace dependencies
pnpm list -r --depth 0
```

### Step 2: Review Impact

**For workspace packages:**

1. Check [Package Ecosystem](/packages/README.md) for dependency graph
2. Identify all dependents
3. Review [COUPLING_ANALYSIS.md](/docs/COUPLING_ANALYSIS.md)

**For external packages:**

1. Check which workspace packages use it
2. Review major version changes
3. Check for breaking changes

### Step 3: Update Strategy

Choose based on risk:

#### Low-Risk Updates (Patch versions: x.x.X)

```bash
# Update patch versions (bug fixes)
pnpm update [package-name]

# Or use caret (^) in package.json - allows patches
"react": "^19.1.0"  # Allows 19.1.x
```

**Risk:** Very Low - No breaking changes expected

#### Medium-Risk Updates (Minor versions: x.X.x)

```bash
# Update minor versions (new features)
pnpm update [package-name]

# Or use caret (^) in package.json - allows minor
"react": "^19.0.0"  # Allows 19.x.x
```

**Risk:** Low - Should be backward compatible

#### High-Risk Updates (Major versions: X.x.x)

```bash
# Update major versions (breaking changes)
pnpm add [package-name]@latest

# Or specify version in package.json
"react": "^20.0.0"  # New major version
```

**Risk:** High - Breaking changes expected

### Step 4: Update Dependencies

#### Updating Single Package

```bash
# In specific workspace package
cd packages/[package-name]
pnpm add [dependency]@latest

# Or update in place
pnpm update [dependency]
```

#### Updating Across Workspace

```bash
# Update in all packages
pnpm update -r [dependency]

# Update specific workspace package everywhere
pnpm update -r @workspace/[package-name]
```

#### Updating Dev Dependencies

```bash
# Update dev dependency
pnpm add -D [dependency]@latest

# Update across workspace
pnpm update -r -D [dependency]
```

### Step 5: Resolve Peer Dependency Conflicts

If you see peer dependency warnings:

```bash
# Check peer dependencies
pnpm why [package-name]

# Install matching peer dependency
pnpm add [peer-dependency]@[version]
```

**Common scenarios:**

- React version mismatches
- TypeScript version conflicts
- Build tool incompatibilities

### Step 6: Update Lock File

```bash
# Regenerate lockfile
pnpm install

# Or force refresh
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Step 7: Validate Changes

Run full validation suite:

```bash
# Type checking (critical!)
pnpm check-types

# Linting
pnpm lint

# Build (catches many issues)
pnpm build

# Tests (if available)
pnpm test
```

**Address ALL errors before proceeding.**

### Step 8: Test Applications

Test in both modes:

```bash
# Standalone mode
cd apps/management-ui-[app-name]
pnpm dev

# Integrated mode
cd apps/management-ui-core
pnpm dev
```

**Manual testing checklist:**

- [ ] App loads without errors
- [ ] Core functionality works
- [ ] Plugin customizations appear
- [ ] No console errors
- [ ] Styles render correctly
- [ ] Navigation works
- [ ] Data fetching works

### Step 9: Update Documentation

If the update affects usage:

1. **Update package README** - Note version requirement
2. **Update migration guide** - Document changes needed
3. **Update examples** - Reflect new API if changed
4. **Update COUPLING_ANALYSIS** - If dependencies changed

### Step 10: Commit Changes

```bash
# Commit with clear message
git add .
git commit -m "chore(deps): update [package-name] to v[version]

- Updated from v[old] to v[new]
- [Breaking changes handled]
- [Migration steps taken]
- All tests passing
"
```

## Special Cases

### Updating React

React updates can affect entire system:

```bash
# Check all React usage
pnpm list react

# Update React and React DOM together
pnpm update -r react react-dom

# Update peer dependencies
pnpm update -r @types/react @types/react-dom
```

**Additional checks:**

- Test all UI components
- Verify plugin components
- Check for deprecated APIs
- Review React 18+ features (concurrent mode, etc.)

### Updating TypeScript

TypeScript updates can cause type errors:

```bash
# Update TypeScript everywhere
pnpm update -r typescript

# Update type definitions
pnpm update -r @types/*
```

**Additional checks:**

- Run `pnpm check-types` in each package
- Fix type errors (don't use `@ts-ignore` without justification)
- Update `tsconfig.json` if needed
- Review new TypeScript features

### Updating Vite

Vite updates affect build process:

```bash
# Update Vite and plugins
pnpm update -r vite @vitejs/plugin-react-swc

# Update vite-config package
cd packages/vite-config
pnpm update vite
```

**Additional checks:**

- Test dev server: `pnpm dev`
- Test build: `pnpm build`
- Verify preview: `pnpm preview`
- Check plugin compatibility

### Updating TanStack Packages

TanStack packages (Query, Router, Table) often update together:

```bash
# Update all TanStack packages
pnpm update -r @tanstack/react-query
pnpm update -r @tanstack/react-router
pnpm update -r @tanstack/react-table
```

**Additional checks:**

- Test data fetching
- Test routing
- Test tables
- Review API changes

### Updating Tailwind CSS

Tailwind updates affect styling:

```bash
# Update Tailwind
pnpm update -r tailwindcss @tailwindcss/vite

# Update config package
cd packages/tailwind-config
pnpm update tailwindcss
```

**Additional checks:**

- Test all styled components
- Verify custom theme works
- Check new utility classes
- Review visual consistency

## Handling Breaking Changes

### 1. Identify Breaking Changes

Read changelogs carefully:

- GitHub releases
- Package changelog
- Migration guides

### 2. Create Adapters

If breaking changes affect many files:

```typescript
// Create adapter for old API
export function legacyFunction(...args) {
  // Map to new API
  return newFunction(transformArgs(args));
}
```

### 3. Update Gradually

For major updates:

1. Update one package at a time
2. Fix issues in that package
3. Test thoroughly
4. Move to next package

### 4. Document Migration

Create migration guide:

```markdown
## Migrating from v1 to v2

### Breaking Changes

1. **Function renamed**: `oldName` → `newName`
2. **Props changed**: `prop` → `newProp`

### Migration Steps

1. Find usage: `grep -r "oldName"`
2. Replace: `oldName(x)` → `newName(x)`
3. Update types
4. Test
```

## Rollback Strategy

If update causes issues:

### Quick Rollback

```bash
# Revert to previous commit
git revert HEAD

# Or reset (if not pushed)
git reset --hard HEAD^

# Reinstall dependencies
pnpm install
```

### Selective Rollback

```bash
# Revert specific package
git checkout HEAD^ -- packages/[package-name]/package.json

# Reinstall
pnpm install
```

### Emergency Fix

```bash
# Pin to known good version
pnpm add [package-name]@[good-version] --save-exact

# Rebuild
pnpm build
```

## Best Practices

### 1. Update Regularly

```bash
# Check weekly for security updates
pnpm audit

# Update monthly for feature updates
pnpm outdated
```

**Benefits:**

- Smaller, manageable changes
- Security patches
- Bug fixes
- New features

### 2. Batch Related Updates

Group related packages:

- UI libraries together
- TanStack packages together
- Build tools together

### 3. Test Thoroughly

Don't skip testing:

- Unit tests
- Integration tests
- Manual testing
- Visual testing

### 4. Use Lock File

Always commit `pnpm-lock.yaml`:

- Ensures reproducible builds
- Prevents surprise updates
- Documents exact versions

### 5. Monitor Bundle Size

After updates:

```bash
# Analyze bundle
pnpm build
# Check dist/ sizes
```

Large increases may indicate bloat.

### 6. Check Security

```bash
# Audit dependencies
pnpm audit

# Fix automatically where possible
pnpm audit --fix
```

## Troubleshooting

### Issue: Peer Dependency Conflicts

```bash
# See conflict details
pnpm install --no-frozen-lockfile

# Resolve by updating peer
pnpm add [peer-dependency]@[compatible-version]
```

### Issue: Type Errors After Update

```bash
# Clear TypeScript cache
rm -rf packages/*/node_modules/.cache

# Rebuild
pnpm check-types
```

Fix type errors - don't suppress them.

### Issue: Build Failures

```bash
# Clean all
pnpm clean

# Reinstall
pnpm install

# Rebuild
pnpm build
```

### Issue: Runtime Errors

1. Check browser console
2. Check dev server logs
3. Review changelog for breaking changes
4. Check for deprecated API usage

## Update Checklist

- [ ] Read changelog and migration guide
- [ ] Check [COUPLING_ANALYSIS.md](/docs/COUPLING_ANALYSIS.md)
- [ ] Backup current state (commit)
- [ ] Update dependencies
- [ ] Resolve peer dependency conflicts
- [ ] Run `pnpm install`
- [ ] Run `pnpm check-types` - all pass
- [ ] Run `pnpm lint` - all pass
- [ ] Run `pnpm build` - all succeed
- [ ] Test standalone mode
- [ ] Test integrated mode
- [ ] Manual testing complete
- [ ] Update documentation if needed
- [ ] Commit with descriptive message
- [ ] Monitor for issues

## Related Documentation

- [Package Ecosystem](/packages/README.md) - Dependency graph
- [Coupling Analysis](/docs/COUPLING_ANALYSIS.md) - Dependency impact
- [Swapping Technologies](/docs/workflows/SWAPPING_TECHNOLOGIES.md) - Replacing packages
- [AI Development Guide](/docs/AI_DEVELOPMENT_GUIDE.md) - Main navigation

## Emergency Contacts

If stuck on a breaking update:

1. Check package issues on GitHub
2. Review migration guides
3. Ask in team channels
4. Consider rollback if blocking

---

**Remember:** Safe updates are incremental, well-tested, and reversible. When in doubt, test more thoroughly.
