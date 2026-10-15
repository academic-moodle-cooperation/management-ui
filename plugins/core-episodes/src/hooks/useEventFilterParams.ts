import { useMemo } from "react";

import { useAppConfig } from "@oc-mui/query";

export interface EventFilterParams {
  channel?: string;
  tags?: string[];
}

export function useEventFilterParams(): EventFilterParams {
  const { config } = useAppConfig();
  const { channel, tags } = config.app;

  return useMemo(
    () => ({
      ...(channel !== undefined && { channel }),
      ...(tags !== undefined && { tags: Array.isArray(tags) ? tags : [tags] }),
    }),
    [channel, tags],
  );
}