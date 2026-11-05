import { i18next } from "@oc-mui/i18n";
import { ComponentResolver } from "@oc-mui/plugin-system";

import { CreateSeriesAction } from "./CreateSeriesAction";

/**
 * Default empty state shown when the user has no series. Offers the same
 * create-series action as the page heading; the action renders nothing when
 * creation is off or no variant is available to this user.
 */
const NoSeriesAvailable = () => (
  <div className="text-center my-16 flex flex-col items-center gap-4">
    <svg
      className="w-12 h-12 mx-auto text-muted-foreground"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
      />
    </svg>
    <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
      {i18next.t("series:noSeriesAvailable.title")}
    </h4>
    <p className="max-w-md text-sm text-muted-foreground">
      {i18next.t("series:noSeriesAvailable.text")}
    </p>
    <CreateSeriesAction />
  </div>
);

/**
 * Empty state for the series table. Resolves the `series:empty-state` override
 * hook so an org plugin can swap it, falling back to the default above. This
 * lives in the series plugin (not @oc-mui/ui) so the shared UI package carries
 * no extension-point or routing knowledge. Passed to {@link MUITable} via its
 * `emptyState` prop.
 */
export const SeriesEmptyState = () => (
  <ComponentResolver
    componentType="series:empty-state"
    defaultComponent={() => <NoSeriesAvailable />}
    componentProps={{}}
    loadingBehavior="none"
  />
);
