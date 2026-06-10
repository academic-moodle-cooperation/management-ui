import { describe, it, expect } from "vitest";

import { createNamespacedKey, createOrganizationNamespace } from "./translationLoader";

// Note: loadNamespace and usePluginTranslation require i18next initialization
// which is complex to mock. These are integration-tested in the apps.
// We test the pure helper functions here.

describe("translationLoader", () => {
  // Note: loadNamespace and usePluginTranslation are integration-tested
  // in the apps where i18next is properly initialized.
  // We test the pure helper functions here.

  describe("createNamespacedKey", () => {
    it("should create namespaced key", () => {
      const result = createNamespacedKey("test", "key");
      expect(result).toBe("test:key");
    });

    it("should handle nested keys", () => {
      const result = createNamespacedKey("test", "nested.key");
      expect(result).toBe("test:nested.key");
    });
  });

  describe("createOrganizationNamespace", () => {
    it("should create organization namespace", () => {
      const result = createOrganizationNamespace("org-a", "footer");
      expect(result).toBe("org-a-footer");
    });

    it("should handle different organizations", () => {
      const result = createOrganizationNamespace("org-b", "header");
      expect(result).toBe("org-b-header");
    });
  });
});
