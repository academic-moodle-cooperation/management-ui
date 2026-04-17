export interface PluginMetadataValidationResult {
  valid: boolean;
  errors: string[];
}

const ALLOWED_CATEGORIES = [
  "feature",
  "theme",
  "integration",
  "utility",
  "config",
  "experimental",
];

/**
 * Runtime validator for plugin.json manifests.
 *
 * Enforces the key constraints from plugin.schema.json without pulling in
 * a full JSON Schema validator:
 * - Required fields are present
 * - Core field types are correct
 * - id, version, and namespace follow basic patterns
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

  const requiredFields = ["id", "name", "description", "version", "author", "namespace"] as const;

  for (const field of requiredFields) {
    if (metadata[field] === undefined || metadata[field] === null) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  if (typeof metadata.id !== "string") {
    errors.push("Field 'id' must be a string");
  } else if (!/^[a-z0-9][a-z0-9.-]*$/.test(metadata.id)) {
    errors.push(
      "Field 'id' must match ^[a-z0-9][a-z0-9.-]*$ (lowercase, digits, hyphens, dots)",
    );
  }

  if (typeof metadata.name !== "string") {
    errors.push("Field 'name' must be a string");
  }

  if (typeof metadata.description !== "string") {
    errors.push("Field 'description' must be a string");
  }

  if (typeof metadata.version !== "string") {
    errors.push("Field 'version' must be a string");
  } else if (!/^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/.test(metadata.version)) {
    errors.push(
      "Field 'version' must use semantic versioning (e.g. 1.0.0 or 1.0.0-beta.1)",
    );
  }

  if (typeof metadata.namespace !== "string") {
    errors.push("Field 'namespace' must be a string");
  } else if (!/^[a-z0-9-]+$/.test(metadata.namespace)) {
    errors.push(
      "Field 'namespace' must match ^[a-z0-9-]+$ (lowercase, digits, hyphens)",
    );
  }

  if (typeof metadata.author !== "object" || metadata.author == null) {
    errors.push("Field 'author' must be an object");
  } else if (typeof metadata.author.name !== "string") {
    errors.push("Field 'author.name' must be a string");
  }

  if (
    metadata.category !== undefined &&
    (typeof metadata.category !== "string" ||
      !ALLOWED_CATEGORIES.includes(metadata.category))
  ) {
    errors.push(
      `Field 'category' must be one of: ${ALLOWED_CATEGORIES.join(", ")}`,
    );
  }

  if (metadata.apiVersion !== undefined) {
    if (typeof metadata.apiVersion !== "string") {
      errors.push("Field 'apiVersion' must be a string");
    } else if (!/^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/.test(metadata.apiVersion)) {
      errors.push(
        "Field 'apiVersion' must use semantic versioning (e.g. 1.0.0). Compatibility is checked by the host loader.",
      );
    }
  }

  if (metadata.modules !== undefined) {
    if (!Array.isArray(metadata.modules)) {
      errors.push("Field 'modules' must be an array");
    } else {
      for (let i = 0; i < metadata.modules.length; i++) {
        const mod = metadata.modules[i];
        if (!mod || typeof mod !== "object") {
          errors.push(`modules[${i}] must be an object`);
          continue;
        }
        if (typeof mod.id !== "string") errors.push(`modules[${i}].id must be a string`);
        if (typeof mod.type !== "string") errors.push(`modules[${i}].type must be a string`);
        if (typeof mod.entry !== "string") errors.push(`modules[${i}].entry must be a string`);
      }
    }
  }

  if (metadata.extensionPoints !== undefined) {
    if (!Array.isArray(metadata.extensionPoints)) {
      errors.push("Field 'extensionPoints' must be an array of strings");
    } else {
      for (let i = 0; i < metadata.extensionPoints.length; i++) {
        if (typeof metadata.extensionPoints[i] !== "string") {
          errors.push(`extensionPoints[${i}] must be a string`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
