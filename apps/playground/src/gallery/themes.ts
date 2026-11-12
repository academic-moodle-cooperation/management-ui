import { useEffect } from "react";

/**
 * The shipped showcase themes, read straight from the shell's public theme
 * directory so the gallery can never drift from what the shell offers. Globs
 * instead of imports: the files live in another app's `public/` folder and
 * are data here, not modules.
 */
interface ThemeEntry {
  id: string;
  name: string;
  tagline?: string;
}

const indexModules = import.meta.glob<{ themes: ThemeEntry[] }>(
  "../../../shell/public/plugins/themes/index.json",
  { eager: true, import: "default" },
);

const themeUrls = import.meta.glob<string>("../../../shell/public/plugins/themes/*.css", {
  eager: true,
  query: "?url",
  import: "default",
});

const urlById = new Map(
  Object.entries(themeUrls).map(([path, url]) => [
    path.slice(path.lastIndexOf("/") + 1, -".css".length),
    url,
  ]),
);

export const THEMES: ThemeEntry[] = [
  { id: "default", name: "Default" },
  ...(Object.values(indexModules)[0]?.themes ?? []).filter((theme) => urlById.has(theme.id)),
];

/** Applies a theme the way the shell does: one `<link data-theme>` on top of the defaults. */
export function useTheme(themeId: string) {
  useEffect(() => {
    document.querySelectorAll("link[data-theme]").forEach((el) => el.remove());
    const href = urlById.get(themeId);
    if (!href) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.dataset["theme"] = themeId;
    document.head.appendChild(link);
  }, [themeId]);
}
