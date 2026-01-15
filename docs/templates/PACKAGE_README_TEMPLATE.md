# @workspace/[package-name]

**Version:** 0.0.0  
**Type:** [Core Infrastructure | Foundation | Integration | Application]  
**Last Updated:** YYYY-MM-DD

## Purpose & Scope

[1-2 paragraph description of what this package does and why it exists]

This package provides [core functionality description]. It is designed to [primary goal] and enables [key capabilities].

**In Scope:**

- [Feature/capability 1]
- [Feature/capability 2]
- [Feature/capability 3]

**Out of Scope:**

- [What this package explicitly does NOT do]
- [Responsibilities that belong elsewhere]

## Architecture & Design Decisions

### Design Principles

[Explain the key architectural decisions and principles guiding this package]

- **[Principle 1]:** [Explanation]
- **[Principle 2]:** [Explanation]
- **[Principle 3]:** [Explanation]

### Key Concepts

[Explain core concepts that users need to understand]

#### [Concept 1]

[Detailed explanation]

```typescript
// Example demonstrating the concept
```

#### [Concept 2]

[Detailed explanation]

### Architecture Diagram

```
┌─────────────────────────────────────────┐
│ [Package Architecture]                  │
├─────────────────────────────────────────┤
│ [Component 1]                           │
│ [Component 2]                           │
│ [Component 3]                           │
└─────────────────────────────────────────┘
```

### Technology Choices

- **[Technology 1]:** [Why chosen, alternatives considered]
- **[Technology 2]:** [Why chosen, alternatives considered]

## API Surface (Public Exports)

### Exports Structure

```typescript
// What is exported from this package
export { MainComponent } from "./MainComponent";
export { useHook } from "./hooks/useHook";
export type { PublicType } from "./types";
```

### Core API

#### [Function/Component Name]

**Purpose:** [Brief description]

**Signature:**

```typescript
function functionName(param: Type): ReturnType;
```

**Parameters:**

- `param` (Type): [Description]

**Returns:** [Description of return value]

**Example:**

```typescript
import { functionName } from "@workspace/[package-name]";

const result = functionName(input);
```

#### [Another Function/Component]

[Repeat structure for each major export]

### Types & Interfaces

```typescript
// Key types exported by this package
export interface MainInterface {
  property: string;
  method(): void;
}

export type MainType = {
  // Type definition
};
```

## Dependencies & Coupling

### Dependency Graph

```
@workspace/[package-name]
├── External Dependencies
│   ├── [external-package] (version) - [why needed]
│   └── [external-package] (version) - [why needed]
└── Workspace Dependencies
    ├── @workspace/[other-package] - [why needed]
    └── @workspace/[other-package] - [why needed]
```

### Dependency Layer

**Layer:** [Core Infrastructure | Foundation | Integration | Application]

**Allowed to depend on:** [Which layers this can depend on]

**Rules:**

- [Dependency rule 1]
- [Dependency rule 2]

### Coupling Analysis

- **Tight Coupling:** [None | List any tight coupling and justification]
- **Loose Coupling:** [Explain loose coupling strategies]
- **Abstraction Points:** [Where abstractions are used]

### Why These Dependencies?

- **[dependency-name]:** [Explanation of why this dependency is necessary]
- **[dependency-name]:** [Could this be abstracted? Future plans?]

### Replacement Strategy

If you need to replace this package:

1. [Step 1]
2. [Step 2]
3. [Step 3]

**Interface Stability:** [How stable is the public API? Safe to replace?]

## Usage Examples

### Basic Usage

```typescript
import { Something } from "@workspace/[package-name]";

// Most common use case
const example = Something();
```

### Advanced Usage

```typescript
// More complex scenarios
```

### Integration with Other Packages

```typescript
// How this package works with others
import { Something } from "@workspace/[package-name]";
import { OtherThing } from "@workspace/other-package";

// Integration example
```

### Common Patterns

#### Pattern 1: [Pattern Name]

```typescript
// Example implementation
```

**When to use:** [Explanation]

#### Pattern 2: [Pattern Name]

```typescript
// Example implementation
```

**When to use:** [Explanation]

## Testing Strategy

### Unit Tests

```bash
# Run tests
pnpm test
```

**Test Coverage:**

- [Component/function 1] - [Coverage description]
- [Component/function 2] - [Coverage description]

### Integration Tests

[Explain how this package is tested in integration with others]

### Testing Patterns

```typescript
// Example test structure
import { something } from "@workspace/[package-name]";

describe("something", () => {
  it("should do expected behavior", () => {
    // Test implementation
  });
});
```

## Extension Points

[If applicable - how can users extend this package?]

### Extension Point 1: [Name]

**Purpose:** [What can be extended]

**How to extend:**

```typescript
// Extension example
```

### Extension Point 2: [Name]

[Repeat for each extension point]

## Migration Guide

### Version History

#### v1.0.0 → v2.0.0

**Breaking Changes:**

- [Change 1]: [Migration steps]
- [Change 2]: [Migration steps]

**Before:**

```typescript
// Old way
```

**After:**

```typescript
// New way
```

### Deprecation Notices

- **[Feature]:** Deprecated in v[x.x.x], will be removed in v[x.x.x]. Use [alternative] instead.

## File Structure

```
packages/[package-name]/
├── src/
│   ├── [main-file].ts         # [Description]
│   ├── [subfolder]/            # [Description]
│   │   ├── [file1].ts         # [Description]
│   │   └── [file2].ts         # [Description]
│   ├── types/                  # TypeScript type definitions
│   │   └── index.ts
│   └── index.ts                # Public API exports
├── tests/                      # Test files (if separate)
│   └── [test-file].test.ts
├── package.json
├── tsconfig.json
└── README.md                   # This file
```

## Development

### Setup

```bash
# Install dependencies (from monorepo root)
pnpm install

# Build this package
cd packages/[package-name]
pnpm build
```

### Commands

```bash
pnpm build        # Build the package
pnpm lint         # Lint the code
pnpm check-types  # Type check without building
pnpm clean        # Clean build artifacts
```

### Adding New Features

1. Determine if the feature belongs in this package (check Purpose & Scope)
2. Add implementation in appropriate file
3. Export from `src/index.ts`
4. Add tests
5. Update this README with:
   - API Surface documentation
   - Usage example
   - Any new dependencies
6. Update migration guide if breaking change

## Performance Considerations

[If applicable - performance characteristics]

- **Bundle Size:** [Approximate size, impact]
- **Runtime Performance:** [Any performance notes]
- **Memory Usage:** [Considerations]

## Known Limitations

- [Limitation 1]: [Explanation and potential workarounds]
- [Limitation 2]: [Explanation and potential workarounds]

## Related Packages

- [`@workspace/[related-package]`](/packages/[related-package]/README.md) - [Relationship description]
- [`@workspace/[related-package]`](/packages/[related-package]/README.md) - [Relationship description]

## Further Reading

- [Architecture Decision Records](/docs/architecture/) - Why this package exists
- [Package Ecosystem](/packages/README.md) - How this fits in the larger system
- [Coupling Analysis](/docs/internal/COUPLING_ANALYSIS.md) - Dependency analysis

## Contributing

When contributing to this package:

1. Read this README thoroughly
2. Check [COUPLING_ANALYSIS.md](/docs/internal/COUPLING_ANALYSIS.md) before adding dependencies
3. Follow existing patterns
4. Add tests for new features
5. Update this documentation
6. Run all validation: `pnpm check-types && pnpm lint && pnpm build`

## License

[License information - usually inherits from project root]
