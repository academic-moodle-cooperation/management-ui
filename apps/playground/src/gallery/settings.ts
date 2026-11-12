import { useCallback, useEffect, useState } from "react";

/**
 * Gallery state lives in the URL so a screenshot run can address one exact
 * view: `?theme=aurora&mode=dark&style=default&only=button&open=dialog&chrome=0`.
 */
export interface GallerySettings {
  /** Theme id from the shell's `plugins/themes/index.json`, or "default". */
  theme: string;
  mode: "light" | "dark";
  /** Style id; written to `data-style` on the root element. */
  style: string;
  /** Render only this section (a component id such as "button"). */
  only: string | null;
  /** Open this overlay on load (a component id such as "dialog"). */
  open: string | null;
  /** `false` hides the toolbar and the index, for clean screenshots. */
  chrome: boolean;
}

/**
 * Styles the switcher offers: one entry per sheet in
 * `packages/ui/src/styles/component-styles/`.
 */
export const STYLES = [
  { id: "default", name: "Default" },
  { id: "compact", name: "Compact" },
] as const;

function read(): GallerySettings {
  const params = new URLSearchParams(window.location.search);
  return {
    theme: params.get("theme") ?? "default",
    mode: params.get("mode") === "dark" ? "dark" : "light",
    style: params.get("style") ?? "default",
    only: params.get("only"),
    open: params.get("open"),
    chrome: params.get("chrome") !== "0",
  };
}

function write(settings: GallerySettings) {
  const params = new URLSearchParams();
  if (settings.theme !== "default") params.set("theme", settings.theme);
  if (settings.mode !== "light") params.set("mode", settings.mode);
  if (settings.style !== "default") params.set("style", settings.style);
  if (settings.only) params.set("only", settings.only);
  if (settings.open) params.set("open", settings.open);
  if (!settings.chrome) params.set("chrome", "0");
  const query = params.toString();
  window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
}

export function useGallerySettings() {
  const [settings, setSettings] = useState<GallerySettings>(read);

  const update = useCallback((patch: Partial<GallerySettings>) => {
    setSettings((current) => ({ ...current, ...patch }));
  }, []);

  useEffect(() => {
    write(settings);
  }, [settings]);

  // Appearance and style are attributes on the root element, the same place
  // the shell puts them, so portalled overlays pick them up too.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", settings.mode === "dark");
  }, [settings.mode]);

  useEffect(() => {
    document.documentElement.dataset["style"] = settings.style;
  }, [settings.style]);

  return [settings, update] as const;
}
