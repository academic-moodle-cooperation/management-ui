# @oc-mui/utils

Pure utility functions shared across the workspace. Zero workspace dependencies — every other package can safely import from here.

## Usage

```ts
import {
  logger,
  deepMerge,
  parseDuration,
  resolveFirstAssetUrl,
  sha256,
} from "@oc-mui/utils";

logger.info("hello");
const merged = deepMerge(a, b);
```

## Surface

| Symbol | Purpose |
|--------|---------|
| `logger`, `Logger`, `LogLevel`, `LogContext` | Structured logger used across the workspace. Replaces ad-hoc `console.log` so output stays consistent and gateable. |
| `deepMerge(target, source)` | Type-safe recursive object merge. Used in the config-layer merge order. |
| `resolveAssetUrl`, `resolveFirstAssetUrl` | Resolve plugin/asset URLs against the runtime base path. |
| `resolveDownloadUrl` | Construct a download URL from a media reference. |
| `buildDownloadFileName({ title?, source?, mimeType? })` | Derive a safe, extension-correct file name for a track download. |
| `parseDuration`, `serializeDuration` | Round-trip ISO 8601 durations (`PT1H30M`). |
| `copyText(text)` | Clipboard helper that handles permission errors. |
| `normalizeMetadataValue`, `normalizeMetadataObject` | Coerce Opencast metadata values into the canonical shape used by `@oc-mui/ui` metadata components. |
| `getEventStatus`, `isEventProcessing`, `hasProcessingEvents` | Status-derivation for Opencast events. |
| `sha256(text)` | Async SHA-256 hash via the Web Crypto API. |

Besides the root export, two subpath exports let build-time callers avoid pulling in the whole barrel: `@oc-mui/utils/assetUrl` (`resolveAssetUrl`, `resolveFirstAssetUrl`) and `@oc-mui/utils/deepMerge` (`deepMerge`).

## Layer

Core infrastructure. Sits at the bottom of the dependency layers — nothing in the workspace depends below it.

## See also

- [`docs/architecture/overview.md`](../../docs/architecture/overview.md#package-layers) — where this package sits in the layer model.
