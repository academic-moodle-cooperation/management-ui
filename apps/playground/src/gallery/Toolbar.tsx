import { STYLES, type GallerySettings } from "./settings";
import { THEMES } from "./themes";

/**
 * The gallery's own controls. Deliberately built from native elements rather
 * than `@oc-mui/ui` components: the toolbar must look the same no matter what
 * the component under test currently looks like.
 */
const CONTROL =
  "border-border bg-background text-foreground h-8 rounded border px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function Toolbar({
  settings,
  update,
}: {
  settings: GallerySettings;
  update: (patch: Partial<GallerySettings>) => void;
}) {
  return (
    <header className="bg-background/95 sticky top-0 z-40 flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-6 py-3 backdrop-blur">
      <h1 className="mr-auto text-sm font-semibold">Component gallery</h1>

      <label className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Theme</span>
        <select
          className={CONTROL}
          value={settings.theme}
          onChange={(event) => update({ theme: event.target.value })}
        >
          {THEMES.map((theme) => (
            <option key={theme.id} value={theme.id}>
              {theme.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Style</span>
        <select
          className={CONTROL}
          value={settings.style}
          onChange={(event) => update({ style: event.target.value })}
        >
          {STYLES.map((style) => (
            <option key={style.id} value={style.id}>
              {style.name}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        className={CONTROL}
        aria-pressed={settings.mode === "dark"}
        onClick={() => update({ mode: settings.mode === "dark" ? "light" : "dark" })}
      >
        {settings.mode === "dark" ? "Dark" : "Light"}
      </button>
    </header>
  );
}
