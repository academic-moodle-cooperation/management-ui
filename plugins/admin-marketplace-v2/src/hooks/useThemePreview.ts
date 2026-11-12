import { useSyncExternalStore } from "react";

import { getThemePreview, subscribeThemePreview } from "../services/themePreview";

/** The theme previewed in this tab, live (no reload involved). */
export function useThemePreview() {
  return useSyncExternalStore(subscribeThemePreview, getThemePreview, () => null);
}
