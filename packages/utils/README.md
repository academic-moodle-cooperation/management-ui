# @workspace/utils

Shared utility functions and helper methods used across the Management UI ecosystem. This package provides common functionality for data processing, formatting, and browser interactions.

## 📦 Utilities

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
│   └── index.ts             # All utility functions
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