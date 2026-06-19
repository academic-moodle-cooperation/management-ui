import { i18next } from "@oc-mui/i18n";

import type { ReactNode } from "react";

/**
 * Shown when an active search/filter yields no matches. This case is generic —
 * it applies to any table regardless of what it lists — so it stays in
 * @oc-mui/ui.
 */
const NoFilteredResults = () => (
  <div className="text-center my-16 flex flex-col items-center">
    <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
      {i18next.t("common:noEntriesHeading")}
    </h4>
    <p className="mt-1 text-sm text-muted-foreground max-w-md">
      {i18next.t("common:noEntriesText")}
    </p>
  </div>
);

/**
 * Renders a data table's empty state.
 *
 * - With an active `queryFilter`, shows a generic "no matches" message.
 * - Otherwise renders the `emptyState` supplied by the feature that owns the
 *   table (e.g. the episodes/series plugins pass their own route-aware empty
 *   state), falling back to a plain "no results" line.
 *
 * @oc-mui/ui deliberately holds no knowledge of specific app routes here — that
 * lives with the plugin that owns the table, which keeps this package free of
 * any router dependency.
 */
const EmptyStateContent = ({
  queryFilter,
  emptyState,
}: {
  queryFilter?: string;
  emptyState?: ReactNode;
}) => {
  if (queryFilter) {
    return <NoFilteredResults />;
  }

  if (emptyState !== undefined) {
    return <>{emptyState}</>;
  }

  return <div>{i18next.t("common:noResults")}</div>;
};

export { EmptyStateContent };
