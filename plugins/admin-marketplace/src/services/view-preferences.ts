/**
 * View Preferences Store
 *
 * Manages user preferences for view modes (cards vs table) across different sections
 * of the Marketplace dashboard. Preferences are persisted to localStorage.
 */

const STORAGE_KEY = "admin-marketplace:view-preferences";

export type ViewMode = "cards" | "table";

export interface ViewPreferences {
  bundledPlugins: ViewMode;
  communityPlugins: ViewMode;
  installedPlugins: ViewMode;
  themes: ViewMode;
}

const DEFAULT_PREFERENCES: ViewPreferences = {
  bundledPlugins: "cards",
  communityPlugins: "cards",
  installedPlugins: "cards",
  themes: "cards",
};

/**
 * Get all view preferences from localStorage
 */
export function getViewPreferences(): ViewPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<ViewPreferences>;
      return {
        ...DEFAULT_PREFERENCES,
        ...parsed,
      };
    }
  } catch (err) {
    console.warn("Failed to load view preferences from localStorage", err);
  }
  return { ...DEFAULT_PREFERENCES };
}

/**
 * Save view preferences to localStorage
 */
export function saveViewPreferences(preferences: ViewPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch (err) {
    console.warn("Failed to save view preferences to localStorage", err);
  }
}

/**
 * Update a specific view preference
 */
export function updateViewPreference(
  section: keyof ViewPreferences,
  mode: ViewMode
): void {
  const current = getViewPreferences();
  const updated = {
    ...current,
    [section]: mode,
  };
  saveViewPreferences(updated);
}

/**
 * Get view mode for a specific section
 */
export function getViewMode(section: keyof ViewPreferences): ViewMode {
  const preferences = getViewPreferences();
  return preferences[section];
}
