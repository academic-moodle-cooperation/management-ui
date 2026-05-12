# @oc-mui/utils

**Version:** 0.0.0  
**Type:** Core Infrastructure  
**Last Updated:** 2025-01-15

## Purpose & Scope

The `@oc-mui/utils` package is a pure utility library that provides shared helper functions, constants, and logic used across the entire Management UI monorepo. It is designed to have **zero workspace dependencies**, making it the most fundamental building block in the system.

**In Scope:**

- Logging system (`logger`).
- Deep merging of objects (`deepMerge`).
- Duration parsing and formatting (using `tinyduration`).
- Cryptographic utilities (SHA-256).
- Asset URL handling.
- Metadata normalization helpers.

**Out of Scope:**

- Anything related to React or UI (must be pure TypeScript/JavaScript).
- Business logic tied to specific domain models (except for generic normalization).

## Architecture & Design Decisions

### Design Principles

- **Zero Coupling:** This package must not depend on any other package in the workspace.
- **Pure Functions:** Most utilities are designed as pure functions with no side effects.
- **High Test Coverage:** Being a core dependency, this package aims for >80% test coverage.

### Key Concepts

#### Logger
A centralized logger that wraps standard console methods but allows for future extensions (e.g., sending logs to a server).

#### DeepMerge
A recursive merge utility specifically designed to handle complex configuration objects, such as merging plugin configs with application defaults.

### Technology Choices

- **crypto-js:** Used for reliable cryptographic operations.
- **tinyduration:** A lightweight library for ISO 8601 duration parsing.

## API Surface (Public Exports)

### Core API

#### `logger`
**Purpose:** Standardized logging.
**Methods:** `info`, `warn`, `error`, `debug`.

#### `deepMerge(target, source)`
**Purpose:** Recursively merges two objects.

#### `assetUrl(path)`
**Purpose:** Normalizes asset URLs for different environment contexts.

## Dependencies & Coupling

### Dependency Graph

```
@oc-mui/utils
└── External Dependencies
    ├── crypto-js (^4.2.0)
    └── tinyduration (^3.3.0)
```

### Dependency Layer

**Layer:** Core Infrastructure

**Allowed to depend on:** External dependencies only.

## Usage Examples

### Using the Logger

```typescript
import { logger } from "@oc-mui/utils";

logger.info("Application started", { version: "1.0.0" });
```

### Using DeepMerge

```typescript
import { deepMerge } from "@oc-mui/utils";

const config = deepMerge(defaults, overrides);
```

## Testing Strategy

### Unit Tests
This package has comprehensive unit tests for all utility functions.

```bash
pnpm test
```

## File Structure

```
packages/utils/
├── src/
│   ├── logger.ts               # Logging system
│   ├── deepMerge.ts            # Object merging
│   ├── duration.ts             # ISO 8601 handling
│   ├── assetUrl.ts             # URL normalization
│   └── index.ts                # Public API exports
├── package.json
└── README.md                   # This file
```

---

## Contributing

1. **NO Workspace Dependencies:** Never add an import from `@oc-mui/*` to this package.
2. **Pure Logic:** Ensure functions are testable and have no side effects where possible.
3. **Tests:** Every new utility function **must** have a corresponding `.test.ts` file with high coverage.
