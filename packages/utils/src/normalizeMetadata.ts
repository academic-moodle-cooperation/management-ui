/**
 * Normalizes metadata values from GraphQL responses
 * Converts null, undefined, and "null" strings to empty strings for consistent handling
 */
export function normalizeMetadataValue(value: unknown): string | string[] {
  // Handle null, undefined, or "null" string
  if (value === null || value === undefined || value === "null") {
    return "";
  }

  // Handle arrays
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (item === null || item === undefined || item === "null") {
          return "";
        }
        return String(item);
      })
      .filter((item) => item !== ""); // Remove empty strings from arrays
  }

  // Handle other values
  return String(value);
}

/**
 * Normalizes an entire metadata object, removing empty values
 */
export function normalizeMetadataObject(
  metadata: Record<string, unknown>
): Record<string, string | string[]> {
  const normalized: Record<string, string | string[]> = {};

  Object.entries(metadata).forEach(([key, value]) => {
    const normalizedValue = normalizeMetadataValue(value);

    // Only include non-empty values
    if (
      normalizedValue !== "" &&
      !(Array.isArray(normalizedValue) && normalizedValue.length === 0)
    ) {
      normalized[key] = normalizedValue;
    }
  });

  return normalized;
}
