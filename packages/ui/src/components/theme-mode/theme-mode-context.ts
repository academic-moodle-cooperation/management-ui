import { createContext, useContext } from "react";

/**
 * The user's appearance choice: an explicit light/dark, or follow the OS.
 */
export type ThemeMode = "light" | "dark" | "system";

/** The appearance actually applied to `<html>`. */
export type ResolvedThemeMode = "light" | "dark";

/**
 * `localStorage` key under which the user's choice is persisted.
 *
 * Deliberately the key the previous `next-themes`-based provider used, so a
 * choice made before the in-house provider landed keeps working. The shell's
 * `index.html` reads the same key before React mounts to avoid a light flash
 * on first paint — keep the two in sync.
 */
export const THEME_MODE_STORAGE_KEY = "theme";

/** What {@link useThemeMode} returns. */
export interface ThemeModeContextValue {
  /** The user's choice: `"light"`, `"dark"`, or `"system"` (follow the OS). */
  theme: ThemeMode;
  /**
   * The appearance applied to `<html>`: `theme` itself, or the OS preference
   * when `theme` is `"system"`.
   */
  resolvedTheme: ResolvedThemeMode;
  /** The OS preference, regardless of `theme`. */
  systemTheme: ResolvedThemeMode;
  /** Change the choice; it is persisted under {@link THEME_MODE_STORAGE_KEY}. */
  setTheme: (theme: ThemeMode) => void;
}

const THEME_MODES: readonly string[] = ["light", "dark", "system"];

export function isThemeMode(value: string): value is ThemeMode {
  return THEME_MODES.includes(value);
}

/**
 * Value seen by {@link useThemeMode} outside a `ThemeModeProvider`: a
 * provider-less render (unit tests, a plugin mounted in the test harness)
 * behaves as "system, currently light" and silently ignores `setTheme`.
 */
const FALLBACK: ThemeModeContextValue = {
  theme: "system",
  resolvedTheme: "light",
  systemTheme: "light",
  setTheme: () => {},
};

export const ThemeModeContext = createContext<ThemeModeContextValue | undefined>(undefined);

/**
 * Read and change the light/dark/system appearance managed by
 * `ThemeModeProvider`. Safe to call without a provider: it then reports
 * "system, currently light" and `setTheme` is a no-op.
 */
export function useThemeMode(): ThemeModeContextValue {
  return useContext(ThemeModeContext) ?? FALLBACK;
}
