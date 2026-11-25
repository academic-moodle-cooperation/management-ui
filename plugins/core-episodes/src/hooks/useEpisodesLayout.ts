import { useCallback, useMemo } from "react";

import { atomWithStorage, useAtomValue, useSetAtom } from "@oc-mui/store";

import type { EpisodesLayout } from "../episodesTableConfig";

/**
 * The user's own list/gallery choice, persisted in this browser. `null` means
 * "never chosen", so the deployment's `episodesTable.defaultLayout` decides —
 * a stored value would otherwise pin the user against a later config change
 * they never opted out of.
 */
const storedLayoutAtom = atomWithStorage<EpisodesLayout | null>("episodes_layout", null);

export interface EpisodesLayoutOptions {
  /** `episodesTable.defaultLayout` — used until the user picks a layout. */
  defaultLayout: EpisodesLayout;
  /** `episodesTable.views.gallery.enabled` — when false, always the list. */
  galleryEnabled: boolean;
}

/**
 * Resolves the layout the episodes table shows: the user's stored choice,
 * else the configured default, and always the list while the gallery is
 * disabled (the stored choice is kept, so re-enabling the gallery restores it).
 */
export function useEpisodesLayout({ defaultLayout, galleryEnabled }: EpisodesLayoutOptions) {
  const storedLayout = useAtomValue(storedLayoutAtom);
  const setStoredLayout = useSetAtom(storedLayoutAtom);

  const layout: EpisodesLayout = useMemo(
    () => (galleryEnabled ? (storedLayout ?? defaultLayout) : "list"),
    [galleryEnabled, storedLayout, defaultLayout],
  );

  const setLayout = useCallback(
    (next: EpisodesLayout) => setStoredLayout(next),
    [setStoredLayout],
  );

  const toggleLayout = useCallback(
    () => setStoredLayout(layout === "list" ? "gallery" : "list"),
    [layout, setStoredLayout],
  );

  return { layout, setLayout, toggleLayout };
}
