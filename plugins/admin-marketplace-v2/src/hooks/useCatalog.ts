import { useCallback, useEffect, useState } from "react";

import { marketplaceV2Config } from "../config";
import {
  clearCatalogCache,
  fetchCatalog,
  type RegistryPlugin,
} from "../services/registry";

export interface CatalogState {
  plugins: RegistryPlugin[];
  loading: boolean;
  /** Non-null when *no* registry could be reached; partial failures degrade silently. */
  error: string | null;
  reload: () => void;
}

/**
 * Loads the merged registry catalog for the Discover view.
 * Read-only: no plugin code is ever fetched or executed here.
 */
export function useCatalog(): CatalogState {
  const cfg = marketplaceV2Config.use();
  const [plugins, setPlugins] = useState<RegistryPlugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generation, setGeneration] = useState(0);

  const registryUrls = cfg.registryUrls;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchCatalog(registryUrls)
      .then((result) => {
        if (cancelled) return;
        setPlugins(result);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // `generation` re-runs the effect on manual reload.
  }, [registryUrls, generation]);

  const reload = useCallback(() => {
    clearCatalogCache();
    setGeneration((g) => g + 1);
  }, []);

  return { plugins, loading, error, reload };
}
