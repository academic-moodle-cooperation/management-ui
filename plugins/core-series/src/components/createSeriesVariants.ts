import { useMemo } from "react";

import { CREATE_SERIES_VARIANTS, type CreateSeriesVariant } from "@oc-mui/plugin-core";
import { useRegistry } from "@oc-mui/plugin-system";
import { useGetUserInfo } from "@oc-mui/query";

import { seriesConfig } from "../config";

type CreateSeriesConfig = NonNullable<
  NonNullable<ReturnType<typeof seriesConfig.use>["seriesTable"]>["createSeries"]
>;

const DEFAULT_ORDER = 100;

/**
 * The variants the current user may pick from, in chooser order. Pure so it
 * can be tested without a plugin manager: config switches first, then the
 * role gate, then the config's `order` override, then the registered `order`.
 */
export const selectCreateSeriesVariants = (
  registered: CreateSeriesVariant[],
  config: CreateSeriesConfig | undefined,
  userRoles: string[] | undefined,
): CreateSeriesVariant[] => {
  if (config?.enabled === false) return [];

  const roles = userRoles ?? [];
  const orderOf = (variant: CreateSeriesVariant) =>
    config?.variants?.[variant.id]?.order ?? variant.order ?? DEFAULT_ORDER;

  return registered
    .filter((variant) => typeof variant.component === "function")
    .filter((variant) => config?.variants?.[variant.id]?.enabled !== false)
    .filter(
      (variant) =>
        !variant.requiredRoles?.length ||
        variant.requiredRoles.some((role) => roles.includes(role)),
    )
    .sort((a, b) => orderOf(a) - orderOf(b));
};

/** {@link selectCreateSeriesVariants} wired to the registry, the config slice and the user. */
export const useCreateSeriesVariants = (): CreateSeriesVariant[] => {
  const { items } = useRegistry<CreateSeriesVariant>(CREATE_SERIES_VARIANTS);
  const cfg = seriesConfig.use();
  const { data: user } = useGetUserInfo();
  const createSeries = cfg.seriesTable?.createSeries;
  const roles = user?.roles;

  return useMemo(
    () => selectCreateSeriesVariants(items, createSeries, roles),
    [items, createSeries, roles],
  );
};
