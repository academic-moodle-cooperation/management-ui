# @workspace/utils

Shared utility functions and helper methods used across the Management UI ecosystem. This package provides common functionality for data processing, formatting, asset resolution, and browser interactions.

## 📦 Utilities

### Asset URL Resolution

Resolve asset paths dynamically based on the execution context (dev vs production):

```typescript
import { resolveAssetUrl, resolveFirstAssetUrl } from '@workspace/utils';

// Resolve a single asset URL
const logoUrl = resolveAssetUrl('assets/logo.svg');
// Dev:  '/management-ui/dist/assets/logo.svg'
// Prod: '/management-ui/assets/logo.svg'

// With fallback
const logo = resolveAssetUrl(config.app.logoUrl, 'assets/favicon/favicon.svg');

// Resolve first available from candidates
const preferredLogo = resolveFirstAssetUrl(
  [config.app.orgLogoUrl, config.app.logoUrl],
  'assets/favicon/favicon.svg'
);

// Absolute URLs pass through unchanged
const external = resolveAssetUrl('https://example.com/logo.png');
// Returns: 'https://example.com/logo.png'
```

**Features:**
- Automatically detects dev vs production mode
- Handles base path detection from DOM scripts
- Preserves absolute URLs (http/https/data)
- Adds `/dist/` prefix in development for vite-plugin-static-copy compatibility

### Deep Merge

Immutable deep merging for configuration objects:

```typescript
import { deepMerge } from '@workspace/utils';

const base = {
  app: { theme: 'default', features: { darkMode: false } },
  api: { timeout: 5000 }
};

const override = {
  app: { theme: 'univie', features: { darkMode: true } }
};

const merged = deepMerge(base, override);
// Result:
// {
//   app: { theme: 'univie', features: { darkMode: true } },
//   api: { timeout: 5000 }
// }

// Multiple sources (later wins)
const result = deepMerge(defaults, pluginConfig1, pluginConfig2);
```

**Merge Behavior:**
- **Objects**: Merged recursively
- **Arrays**: Replaced (not concatenated)
- **Primitives**: Later values override earlier ones
- **Undefined**: Skipped (doesn't override existing values)

This is used internally by the configuration system to merge plugin configs. See [Configuration Generation](/docs/CONFIG_GENERATION.md) for details.

### Duration Handling

Parse and format ISO 8601 duration strings for video content:

```typescript
import { parseDuration, serializeDuration } from '@workspace/utils';

// Parse duration to HH:MM:SS format
const formatted = parseDuration('PT1H30M45S'); // "01:30:45"
const formatted2 = parseDuration('PT2M30S');    // "00:02:30"

// Serialize duration object back to ISO format
const duration = { hours: 1, minutes: 30, seconds: 45 };
const iso = serializeDuration(duration); // "PT1H30M45S"
```

### Cryptography

Hash generation for data integrity and caching:

```typescript
import { sha256 } from '@workspace/utils';

// Generate SHA-256 hash
const hash = sha256('my-data').toString();
```

### Clipboard Operations

Cross-platform clipboard functionality with fallbacks:

```typescript
import { copyText } from '@workspace/utils';

// Copy text to clipboard (handles permissions and fallbacks)
const success = await copyText('Text to copy');
if (success) {
  console.log('Text copied successfully');
}
```

### Metadata Processing

Normalize and clean metadata from GraphQL responses:

```typescript
import { normalizeMetadataValue, normalizeMetadataObject } from '@workspace/utils';

// Normalize individual values (handles null, undefined, "null" strings)
const clean = normalizeMetadataValue(null);        // ""
const clean2 = normalizeMetadataValue(['a', null, 'b']); // ["a", "b"]

// Normalize entire metadata objects
const metadata = {
  title: 'My Video',
  description: null,
  tags: ['tag1', null, 'tag2'],
  category: undefined
};

const cleaned = normalizeMetadataObject(metadata);
// { title: 'My Video', tags: ['tag1', 'tag2'] }
```

## 🔧 Features

### Asset Management

- **Dynamic path resolution**: Automatically handles dev vs production paths
- **Base path detection**: Discovers base URL from DOM or environment
- **Fallback chains**: Specify multiple candidates with default fallback
- **URL preservation**: Absolute URLs pass through unchanged

### Configuration Merging

- **Immutable operations**: Returns new objects, never mutates inputs
- **Recursive merging**: Deeply nested objects are merged correctly
- **Array handling**: Arrays are replaced, not concatenated (intentional for config overrides)
- **Undefined safety**: Undefined values don't override existing properties

### Browser Compatibility

- **Cross-platform clipboard**: Handles iOS, desktop, and legacy browsers
- **Permission handling**: Requests clipboard permissions when available
- **Fallback support**: Uses deprecated APIs when modern ones aren't available

### Data Processing

- **Null safety**: Consistent handling of null/undefined values from APIs
- **Type normalization**: Converts mixed data types to consistent string formats
- **Array filtering**: Removes empty values from arrays automatically

### Video Content Support

- **Duration parsing**: ISO 8601 duration strings to readable HH:MM:SS format
- **Metadata normalization**: Clean GraphQL responses for UI display
- **Hash generation**: Content integrity verification

## 🚀 Usage

### Installation

The utils package is automatically available in all monorepo applications:

```typescript
import { parseDuration, copyText, sha256 } from '@workspace/utils';
```

### Common Patterns

#### Logo Component with Fallback

```typescript
import { resolveFirstAssetUrl } from '@workspace/utils';
import { useAppConfig } from '@workspace/query';

function Logo() {
  const { config } = useAppConfig();
  
  const logoSrc = resolveFirstAssetUrl(
    [config.app.orgLogoUrl, config.app.logoUrl],
    'assets/favicon/favicon.svg'
  );
  
  return <img src={logoSrc} alt="Logo" className="h-10 w-auto" />;
}
```

#### Configuration Merging

```typescript
import { deepMerge } from '@workspace/utils';

const defaultConfig = {
  app: { theme: 'default', features: {} }
};

const universityConfig = {
  app: { theme: 'univie', features: { calendar: true } }
};

const merged = deepMerge(defaultConfig, universityConfig);
// { app: { theme: 'univie', features: { calendar: true } } }
```

#### Video Duration Display

```typescript
import { parseDuration } from '@workspace/utils';

function VideoDuration({ duration }: { duration: string }) {
  const formatted = parseDuration(duration);
  return <span className="text-sm text-gray-500">{formatted}</span>;
}
```

#### Metadata Form Processing

```typescript
import { normalizeMetadataObject } from '@workspace/utils';

function saveMetadata(formData: FormData) {
  const rawMetadata = Object.fromEntries(formData);
  const cleanMetadata = normalizeMetadataObject(rawMetadata);
  
  // Save only non-empty values
  return api.updateMetadata(cleanMetadata);
}
```

#### Copy to Clipboard with Toast

```typescript
import { copyText } from '@workspace/utils';
import { toast } from '@workspace/ui';

async function handleCopyLink(url: string) {
  const success = await copyText(url);
  
  if (success) {
    toast.success('Link copied to clipboard');
  } else {
    toast.error('Failed to copy link');
  }
}
```

## 📁 Package Structure

```
packages/utils/
├── src/
│   ├── index.ts             # Main exports
│   ├── assetUrl.ts          # Asset URL resolution utilities
│   └── deepMerge.ts         # Deep merge utility
├── package.json
├── tsconfig.json
└── README.md
```

## 🧪 Testing

```bash
# Type checking
pnpm check-types

# Linting
pnpm lint
```

## 🤝 Contributing

### Adding New Utilities

1. **Add the function** to `src/index.ts`
2. **Export it** from the main export list
3. **Include TypeScript types** for all parameters and return values
4. **Add JSDoc comments** for complex functions
5. **Consider browser compatibility** for DOM/Navigator APIs

### Guidelines

- **Pure functions preferred**: Avoid side effects where possible
- **Null-safe by default**: Handle null/undefined inputs gracefully
- **Browser compatibility**: Use feature detection for web APIs
- **TypeScript first**: Provide full type safety
- **Small and focused**: Keep utilities simple and reusable

### Example Utility Addition

```typescript
/**
 * Formats file sizes into human-readable strings
 * @param bytes - File size in bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string like "1.5 MB"
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}
```

This utilities package provides the foundational helper functions that enable consistent data processing and user interactions across the entire Management UI ecosystem. 