/**
 * Immutable deep merge for objects
 *
 * Merges multiple source objects into a target object recursively.
 * - Arrays are replaced (not merged)
 * - Objects are merged recursively
 * - Later sources override earlier sources
 * - undefined values are skipped
 *
 * @param target - The base object to merge into
 * @param sources - One or more source objects to merge
 * @returns A new merged object
 */
export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  ...sources: Array<Partial<T> | Record<string, unknown>>
): T {
  return sources.reduce(
    (acc, source) => {
      if (!source) return acc;
      const sourceRecord = source as Record<string, unknown>;
      Object.keys(sourceRecord).forEach((key) => {
        const sourceValue = sourceRecord[key];
        const accValue = acc[key];
        if (Array.isArray(accValue) && Array.isArray(sourceValue)) {
          // Replace arrays (don't merge them)
          (acc as Record<string, unknown>)[key] = sourceValue;
        } else if (
          accValue &&
          typeof accValue === "object" &&
          sourceValue &&
          typeof sourceValue === "object" &&
          !Array.isArray(accValue) &&
          !Array.isArray(sourceValue)
        ) {
          // Recursively merge objects
          (acc as Record<string, unknown>)[key] = deepMerge(
            { ...(accValue as Record<string, unknown>) },
            sourceValue as Record<string, unknown>,
          );
        } else if (sourceValue !== undefined) {
          // Replace primitive values
          (acc as Record<string, unknown>)[key] = sourceValue;
        }
      });
      return acc;
    },
    { ...target },
  ) as T;
}
