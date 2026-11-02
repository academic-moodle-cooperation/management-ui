import { useEffect, useState } from "react";

import { useAppConfig } from "@oc-mui/query";

import { fetchJarEntries, fetchLocalEntries, type InventoryConfig } from "../services/inventory";
import {
  collectThemes,
  discoverOrgThemes,
  fetchShippedThemes,
  type ThemeCandidate,
} from "../services/themes";

import type { RegistryPlugin } from "../services/registry";

export interface ThemesState {
  themes: ThemeCandidate[];
  loading: boolean;
  /** The theme the deployment applies for everyone (`app.theme`). */
  activeConfigValue: string;
}

/** Every theme this deployment could apply, from all three sources. */
export function useThemes(catalog: RegistryPlugin[]): ThemesState {
  const { config } = useAppConfig();
  const inventoryConfig = config as unknown as InventoryConfig | undefined;
  const activeConfigValue =
    ((config as unknown as { app?: { theme?: string } } | undefined)?.app?.theme ?? "default") || "default";
  const [found, setFound] = useState<Omit<ThemesState, "activeConfigValue"> | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [shipped, jars, locals] = await Promise.all([
        fetchShippedThemes(),
        fetchJarEntries(inventoryConfig),
        fetchLocalEntries(),
      ]);
      const orgThemes = await discoverOrgThemes(jars, locals);
      if (!cancelled) setFound({ themes: collectThemes({ shipped, orgThemes, catalog }), loading: false });
    })();
    return () => {
      cancelled = true;
    };
    // Only the URL-relevant config fields and the catalog identity matter here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inventoryConfig?.api?.baseUrl, inventoryConfig?.productionAppPluginUrl, catalog]);

  return { themes: found?.themes ?? [], loading: found === null, activeConfigValue };
}
