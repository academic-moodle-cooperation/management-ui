import { i18next } from "@opencast-mui/i18n";
import { Link } from "@opencast-mui/router";

/**
 * Empty state for the episodes table: a call-to-action linking to the upload
 * route. This lives in the episodes plugin (not @opencast-mui/ui) because it knows
 * about an app-specific route — keeping that routing knowledge out of the
 * shared UI package. Passed to {@link MUITable} via its `emptyState` prop.
 */
export const EpisodesEmptyState = () => (
  <div className="text-center my-16 flex flex-col items-center">
    <Link to="/upload" title="Upload">
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
      <p className="text-sm text-muted-foreground">{i18next.t("episodes:noVideos")}</p>
    </Link>
  </div>
);
