import { Monitor, Moon, Sun } from "lucide-react";

import { useTranslation } from "@oc-mui/i18n";

import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

import { useThemeMode } from "./theme-mode-context";

/**
 * Light / Dark / System appearance switcher. Pairs with `ThemeModeProvider` (host-only, `@oc-mui/ui/internal`).
 *
 * The trigger shows a sun in light mode and a moon in dark mode (cross-faded
 * via the `dark:` variant). Selecting an option persists it through
 * `ThemeModeProvider` (host-only, `@oc-mui/ui/internal`); "System" follows the OS preference.
 */
export function ThemeModeToggle() {
  const { setTheme } = useThemeMode();
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("appearance.toggle")}>
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          {t("appearance.light")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          {t("appearance.dark")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Monitor className="mr-2 h-4 w-4" />
          {t("appearance.system")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
