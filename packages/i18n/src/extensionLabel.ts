import React from "react";

import { loadNamespace } from "./translationLoader";
import { useI18n } from "./useTranslation";

/**
 * The visible label for a plugin-contributed entry (a sidebar tab, say).
 *
 * Hosts used to derive the label from the registration key by string surgery —
 * `acme:exam-recordings` became "Exam Recordings". That label could never be
 * translated and leaked the internal key naming into the UI. A plugin can now
 * register a `label`, which follows the same convention as `sidebar:nav-items`
 * titles: a translation key, resolved here at render time so it follows a
 * language switch.
 *
 * The derivation stays as the fallback, so every registration that predates
 * the option renders exactly as before.
 */

/** `acme:exam-recordings` → `Exam Recordings`. The pre-`label` behaviour. */
export const deriveLabelFromKey = (key: string): string =>
  key
    .replace(/^.*:/, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

/** The namespace part of `namespace:key`, or `undefined` for a bare key. */
const namespaceOf = (translationKey: string): string | undefined => {
  const colon = translationKey.indexOf(":");
  return colon > 0 ? translationKey.slice(0, colon) : undefined;
};

/**
 * Resolve the labels for a set of plugin registrations.
 *
 * Takes the registrations rather than one label so the namespaces can be
 * loaded in one effect: a plugin's own namespace is fetched on demand by
 * `usePluginTranslation` inside its component, which may not have mounted yet
 * when the host renders the label. Until a namespace arrives, the entry falls
 * back to its derived label rather than flashing a raw key.
 */
export const useExtensionLabels = (
  entries: ReadonlyArray<{ key: string; label?: string | undefined }>,
): ((entry: { key: string; label?: string | undefined }) => string) => {
  const { t, i18n } = useI18n();

  const namespaces = entries
    .map((entry) => (entry.label ? namespaceOf(entry.label) : undefined))
    .filter((namespace): namespace is string => Boolean(namespace));

  // Join, so the effect re-runs when the set of namespaces actually changes
  // rather than on every render (the array is rebuilt each time).
  const namespaceKey = [...new Set(namespaces)].sort().join(",");

  React.useEffect(() => {
    if (!namespaceKey) return;
    namespaceKey.split(",").forEach((namespace) => void loadNamespace(namespace, i18n.language));
  }, [namespaceKey, i18n.language]);

  return (entry) => {
    if (entry.label && i18n.exists(entry.label)) return t(entry.label);
    // A label that carries no colon is a literal, not a key — a plugin may
    // legitimately ship one for a single-language deployment.
    if (entry.label && !entry.label.includes(":")) return entry.label;
    return deriveLabelFromKey(entry.key);
  };
};
