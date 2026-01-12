# Test Strategy

**Last Updated:** 2025-01-12

## Overview

This document defines the testing strategy for the Management UI monorepo, including coverage goals, test priorities, and testing patterns.

## Test Framework

- **Framework:** Vitest 4.0+
- **React Testing:** @testing-library/react
- **DOM Testing:** @testing-library/jest-dom
- **User Interaction:** @testing-library/user-event

## Coverage Goals

### Overall Targets

- **Total Coverage:** 60%+ (minimum)
- **Critical Paths:** 80%+ (minimum)
- **Core Infrastructure:** 80%+ (minimum)

### Package-Specific Targets

#### Core Infrastructure (80%+ Coverage)

- `packages/utils` - All utility functions
- `packages/plugin-system` - Core functions (Plugin Manager, Registry)
- `packages/store` - State management

#### Foundation Layer (70%+ Coverage)

- `packages/i18n` - Translation functions

#### Integration Layer (60%+ Coverage)

- `packages/query` - Hooks, Client
- `packages/router` - Route protection, Auth
- `packages/ui` - Components (Priority: Shared Components)

#### Application Layer (50%+ Coverage)

- `packages/app-runtime` - Runtime abstraction
- `packages/providers` - Provider composition
- `packages/ui-config` - Config merging
- `packages/vite-config` - Config generation

## Test Types

### 1. Unit Tests (Priority 1)

**Focus:** Individual functions, utilities, and components in isolation

**Examples:**
- Utility functions (`deepMerge`, `normalizeMetadataValue`)
- Logger functionality
- Plugin Manager methods
- State management functions

**Tools:**
- Vitest
- @testing-library/react (for React components)

### 2. Integration Tests (Priority 2)

**Focus:** Package interactions and component integration

**Examples:**
- Plugin system integration
- Query hooks with mock GraphQL
- Router protection logic
- Component composition

**Tools:**
- Vitest
- Mock Service Worker (MSW) for API mocking

### 3. E2E Tests (Priority 3)

**Focus:** Critical user flows and complete workflows

**Examples:**
- User authentication flow
- Content upload workflow
- Plugin registration and activation
- App navigation

**Tools:**
- Playwright or Cypress (to be determined)

## Test Organization

### File Structure

```
packages/[package-name]/
├── src/
│   ├── [module].ts
│   └── [module].test.ts      # Co-located tests
└── vitest.config.ts          # Package-specific config
```

### Naming Conventions

- Test files: `*.test.ts` or `*.test.tsx`
- Test suites: Use `describe` blocks for grouping
- Test cases: Use descriptive `it` or `test` blocks

## Testing Patterns

### Component Testing

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Hook Testing

```typescript
import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useMyHook } from './useMyHook';

describe('useMyHook', () => {
  it('should return expected value', () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current).toBeDefined();
  });
});
```

### Utility Function Testing

```typescript
import { describe, it, expect } from 'vitest';
import { myUtility } from './myUtility';

describe('myUtility', () => {
  it('should handle edge cases', () => {
    expect(myUtility(input)).toEqual(expected);
  });
});
```

## Mocking Strategy

### API Mocking

- Use MSW (Mock Service Worker) for GraphQL/HTTP mocking
- Mock at the network level, not at the fetch level

### Component Mocking

- Mock external dependencies
- Use `vi.mock()` for module mocking
- Create test fixtures for complex data structures

## CI/CD Integration

### GitHub Actions

- Run tests on every PR
- Generate coverage reports
- Upload coverage to Codecov
- Fail PR if coverage drops below threshold

### Pre-commit Hooks (Future)

- Run tests on changed files
- Prevent commits if tests fail

## Test Data Management

### Test Fixtures

- Create reusable test data factories
- Use `createFactory` pattern for consistent test data
- Store fixtures in `__fixtures__` directories

### Test Utilities

- Shared test utilities in `packages/utils/src/test-utils/`
- Common mocks and helpers
- Custom matchers if needed

## Current Status

### Completed

- ✅ Vitest setup and configuration
- ✅ Test utilities created
- ✅ First tests for `packages/utils` (logger, deepMerge)
- ✅ CI/CD workflow created

### In Progress

- ⏳ Test coverage for core infrastructure packages
- ⏳ React component tests
- ⏳ Integration tests

### Planned

- ⬜ E2E test setup
- ⬜ Coverage reporting and tracking
- ⬜ Test documentation and examples

## Next Steps

1. **Week 5:** Complete core infrastructure tests (utils, plugin-system)
2. **Week 6:** Foundation and integration layer tests
3. **Week 7:** App-level tests
4. **Week 8-12:** Continuous test writing during code review
5. **Week 15-18:** Finalize coverage and add E2E tests

---

**Note:** This strategy is a living document and will be updated as the testing infrastructure evolves.
