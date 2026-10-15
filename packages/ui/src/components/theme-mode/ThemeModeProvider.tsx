import { useCallback, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from "react";

import {
  isThemeMode,
  THEME_MODE_STORAGE_KEY,
  ThemeModeContext,
  type ResolvedThemeMode,
  type ThemeMode,
  type ThemeModeContextValue,
} from "./theme-mode-context";

const DARK_QUERY = "(prefers-color-scheme: dark)";
const RESOLVED_CLASSES: readonly ResolvedThemeMode[] = ["light", "dark"];

function readStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "system";
  try {
    const stored = window.localStorage.getItem(THEME_MODE_STORAGE_KEY);
    if (stored !== null && isThemeMode(stored)) return stored;
  } catch {
    // Storage unavailable (privacy mode, sandboxed iframe): fall through.
  }
  return "system";
}

function readSystemTheme(): ResolvedThemeMode {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "light";
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

/**
 * Briefly turns every CSS transition off so that switching the token set is
 * instantaneous rather than a half-second cross-fade of every surface.
 * Returns the function that lifts the suppression again.
 */
function suppressTransitions(): () => void {
  const style = document.createElement("style");
  style.appendChild(
    document.createTextNode(
      "*,*::before,*::after{-webkit-transition:none!important;transition:none!important}",
    ),
  );
  document.head.appendChild(style);
  return () => {
    // Force a style flush so the swapped tokens land while transitions are
    // still disabled; only then lift the rule.
    window.getComputedStyle(document.body);
    setTimeout(() => style.remove(), 1);
  };
}

function applyResolvedTheme(resolved: ResolvedThemeMode): void {
  const root = document.documentElement;
  const alreadyApplied =
    root.classList.contains(resolved) &&
    !RESOLVED_CLASSES.some((cls) => cls !== resolved && root.classList.contains(cls)) &&
    root.style.colorScheme === resolved;
  // Nothing to do when the shell's `index.html` bootstrap (or a previous
  // render) already applied this appearance — and no transition to suppress.
  if (alreadyApplied) return;

  const restoreTransitions = suppressTransitions();
  root.classList.remove(...RESOLVED_CLASSES);
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
  restoreTransitions();
}

/**
 * Appearance (light / dark / system) provider.
 *
 * Applies a `.dark` (or `.light`) class plus the matching `color-scheme` on
 * `<html>`, which drives the dark design tokens defined in `globals.css` (the
 * `@custom-variant dark` and the `.dark { … }` token block). Mount this once
 * near the app root; read or change the choice with {@link useThemeMode}.
 *
 * This is the **appearance axis** and is deliberately *orthogonal* to the
 * org-branding theme selected by `app.theme` (loaded as a CSS file). A
 * deployment's org theme should define both `:root` (light) and `.dark`
 * overrides so it looks right in either appearance.
 *
 * - Defaults to `"system"` and follows the OS preference reactively; the
 *   user's explicit choice is persisted in `localStorage` under
 *   {@link THEME_MODE_STORAGE_KEY} and synced across tabs.
 * - The class is applied in a layout effect, i.e. before the first React
 *   frame paints. Hosts that want to avoid a flash of the unstyled `<body>`
 *   *before* React mounts add a tiny bootstrap script to their HTML that reads
 *   the same key — the shell's `index.html` does.
 * - Transitions are suppressed while the tokens swap, so toggling does not
 *   cross-fade every surface.
 *
 * No `<script>` is rendered inside the React tree (React ≥ 19.2 logs an error
 * for that), which is why this replaced the earlier `next-themes` wrapper.
 */
export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(readStoredTheme);
  const [systemTheme, setSystemTheme] = useState<ResolvedThemeMode>(readSystemTheme);
  const resolvedTheme: ResolvedThemeMode = theme === "system" ? systemTheme : theme;

  useLayoutEffect(() => {
    applyResolvedTheme(resolvedTheme);
  }, [resolvedTheme]);

  // Follow the OS preference while the app is open.
  useEffect(() => {
    const query = window.matchMedia(DARK_QUERY);
    const onChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? "dark" : "light");
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  // A choice made in another tab of the same origin applies here too.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== THEME_MODE_STORAGE_KEY) return;
      setThemeState(
        event.newValue !== null && isThemeMode(event.newValue) ? event.newValue : "system",
      );
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next);
    try {
      window.localStorage.setItem(THEME_MODE_STORAGE_KEY, next);
    } catch {
      // Storage unavailable: the choice still holds for this page's lifetime.
    }
  }, []);

  const value = useMemo<ThemeModeContextValue>(
    () => ({ theme, resolvedTheme, systemTheme, setTheme }),
    [theme, resolvedTheme, systemTheme, setTheme],
  );

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
}
