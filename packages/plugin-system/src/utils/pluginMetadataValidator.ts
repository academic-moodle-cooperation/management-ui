export interface PluginMetadataValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Minimal runtime validator for plugin-metadata.json.
 *
 * This does not implement the full JSON Schema draft-07 spec, but enforces
 * the key constraints we care about for development and CI:
 * - Required fields are present
 * - Types of core fields are correct
 * - id and version follow basic patterns
 */
export function validatePluginMetadata(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: any,
): PluginMetadataValidationResult {
  const errors: string[] = [];

  if (metadata == null || typeof metadata !== "object") {
    return {
      valid: false,
      errors: ["Metadata must be a non-null object"],
    };
  }

  // Required top-level fields
  const requiredFields: Array<keyof typeof metadata> = [
    "id",
    "name",
    "description",
    "version",
    "author",
    "category",
  ];

  for (const field of requiredFields) {
    if (metadata[field] === undefined || metadata[field] === null) {
      errors.push(`Missing required field: ${String(field)}`);
    }
  }

  // id
  if (typeof metadata.id !== "string") {
    errors.push("Field 'id' must be a string");
  } else if (!/^[a-z0-9-]+$/.test(metadata.id)) {
    errors.push(
      "Field 'id' must match ^[a-z0-9-]+$ (lowercase, digits, hyphens only)",
    );
  }

  // name
  if (typeof metadata.name !== "string") {
    errors.push("Field 'name' must be a string");
  }

  // description
  if (typeof metadata.description !== "string") {
    errors.push("Field 'description' must be a string");
  }

  // version
  if (typeof metadata.version !== "string") {
    errors.push("Field 'version' must be a string");
  } else if (!/^\d+\.\d+\.\d+$/.test(metadata.version)) {
    errors.push(
      "Field 'version' must use semantic versioning (e.g. 1.0.0)",
    );
  }

  // author
  if (typeof metadata.author !== "object" || metadata.author == null) {
    errors.push("Field 'author' must be an object");
  } else if (typeof metadata.author.name !== "string") {
    errors.push("Field 'author.name' must be a string");
  }

  // category
  const allowedCategories = [
    "feature",
    "theme",
    "integration",
    "utility",
    "experimental",
  ];
  if (typeof metadata.category !== "string") {
    errors.push("Field 'category' must be a string");
  } else if (!allowedCategories.includes(metadata.category)) {
    errors.push(
      `Field 'category' must be one of: ${allowedCategories.join(", ")}`,
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

