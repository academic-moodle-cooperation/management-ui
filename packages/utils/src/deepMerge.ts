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
export function deepMerge(
  target: Record<string, any>,
  ...sources: Record<string, any>[]
): Record<string, any> {
  return sources.reduce(
    (acc, source) => {
      if (!source) return acc;
      Object.keys(source).forEach((key) => {
        const sourceValue = source[key];
        const accValue = acc[key];
        if (Array.isArray(accValue) && Array.isArray(sourceValue)) {
          // Replace arrays (don't merge them)
          acc[key] = sourceValue;
        } else if (
          accValue &&
          typeof accValue === "object" &&
          sourceValue &&
          typeof sourceValue === "object" &&
          !Array.isArray(accValue) &&
          !Array.isArray(sourceValue)
        ) {
          // Recursively merge objects
          acc[key] = deepMerge({ ...accValue }, sourceValue);
        } else if (sourceValue !== undefined) {
          // Replace primitive values
          acc[key] = sourceValue;
        }
      });
      return acc;
    },
    { ...target }
  );
}
