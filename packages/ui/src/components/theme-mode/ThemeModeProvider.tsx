import { ThemeProvider as NextThemesProvider } from "next-themes";

import type { ReactNode } from "react";

/**
 * Appearance (light / dark / system) provider.
 *
 * Wraps `next-themes` to apply a `.dark` class on `<html>`, which drives the
 * dark design tokens defined in `globals.css` (the `@custom-variant dark`
 * and the `.dark { … }` token block). Mount this once near the app root.
 *
 * This is the **appearance axis** and is deliberately *orthogonal* to the
 * org-branding theme selected by `app.theme` (loaded as a CSS file). A
 * deployment's org theme should define both `:root` (light) and `.dark`
 * overrides so it looks right in either appearance.
 *
 * - `defaultTheme="system"` + `enableSystem`: respects the OS preference out
 *   of the box; the user's explicit choice is persisted by next-themes.
 * - `disableTransitionOnChange`: avoids a color-transition flash when toggling.
 */
export function ThemeModeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
