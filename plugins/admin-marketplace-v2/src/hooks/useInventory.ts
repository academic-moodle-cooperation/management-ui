import { useEffect, useState } from "react";

import { usePluginManager } from "@oc-mui/plugin-system";
import { useAppConfig } from "@oc-mui/query";

import {
  buildInventory,
  bundledPlugins,
  fetchJarEntries,
  fetchLocalEntries,
  type InventoryConfig,
  type InventoryItem,
  type JarEntry,
  type LocalEntry,
} from "../services/inventory";
import { getTrials } from "../services/trials";

import type { RegistryPlugin } from "../services/registry";

export interface InventoryState {
  items: InventoryItem[];
  loading: boolean;
}

/**
 * The deployment's plugin inventory for the Library view. Read-only: it
 * observes the manager, the config, the JAR manifest and the tab's trials.
 */
export function useInventory(catalog: RegistryPlugin[]): InventoryState {
  const manager = usePluginManager();
  const { config } = useAppConfig();
  const [remote, setRemote] = useState<{ jars: JarEntry[]; locals: LocalEntry[] } | null>(null);

  const inventoryConfig = config as unknown as InventoryConfig | undefined;

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchJarEntries(inventoryConfig), fetchLocalEntries()]).then(([jars, locals]) => {
      if (!cancelled) setRemote({ jars, locals });
    });
    return () => {
      cancelled = true;
    };
    // Config identity changes on every merge; the manifests only depend on its URL fields.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inventoryConfig?.api?.baseUrl, inventoryConfig?.productionAppPluginUrl]);

  if (!remote) return { items: [], loading: true };

  const items = buildInventory({
    registered: manager.plugins,
    bundled: bundledPlugins(manager),
    jars: remote.jars,
    locals: remote.locals,
    trials: getTrials(),
    catalog,
    config: inventoryConfig,
  });

  return { items, loading: false };
}
