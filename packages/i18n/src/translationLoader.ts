import React from "react";
import { useTranslation } from "react-i18next";
import { i18next } from "./index";

export const loadNamespace = async (
  namespace: string,
  language = i18next.language.split("-")[0] || "de"
) => {
  if (!i18next.hasResourceBundle(language, namespace)) {
    try {
      await i18next.loadNamespaces([namespace]);
    } catch (error) {
      // Failed to load namespace - fallback to default behavior
      void error; // Acknowledge the error without using it
    }
  } else {
    // Resource bundle already exists
  }
};

/**
 * Enhanced hook for plugin translations with auto-loading
 * @param namespaces - Array of namespaces to load
 * @param autoLoad - Whether to auto-load namespaces (default: true)
 */
export const usePluginTranslation = (namespaces: string[], autoLoad = true) => {
  const { t, i18n } = useTranslation(namespaces);

  React.useEffect(() => {
    if (autoLoad) {
      const loadTranslations = async () => {
        for (const namespace of namespaces) {
          await loadNamespace(namespace, i18n.language);
        }
      };
      loadTranslations();
    }
  }, [i18n.language, namespaces, autoLoad]);

  return { t, i18n };
};

/**
 * Helper to create namespaced translation keys
 * @param namespace - The namespace prefix
 * @param key - The translation key
 * @returns Namespaced key string
 */
export const createNamespacedKey = (namespace: string, key: string) => `${namespace}:${key}`;

/**
 * Helper for organization-specific namespace patterns
 * @param organization - Organization code (e.g., 'tuwien', 'univie')
 * @param component - Component name (e.g., 'footer', 'header')
 * @returns Standardized namespace
 */
export const createOrganizationNamespace = (organization: string, component: string) =>
  `${organization}-${component}`;

// Re-export React hooks for convenience
export { useTranslation };
