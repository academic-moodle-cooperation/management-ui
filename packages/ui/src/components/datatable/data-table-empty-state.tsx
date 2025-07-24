import { i18next, LinkText, Trans } from "@workspace/i18n";
import { ComponentResolver } from "@workspace/plugin-system";
import { Link } from "@workspace/router";

/**
 * Component to display when no rows match the filter criteria
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
 * Component to display when no episodes are available
 */
const NoEpisodesAvailable = () => (
  <div className="text-center my-16 flex flex-col items-center">
    <Link to={'/upload'} title="Upload" >
      <svg
        className="w-12 h-12 mx-auto text-gray-400"
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

/**
 * Component to display when no series are available
 */
const NoSeriesAvailable = () => (
  <div className="text-center my-16 flex flex-col items-center">
    <svg
      className="w-12 h-12 mx-auto text-gray-400"
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
  </div>
);


/**
 * Component to render the empty state based on path and filter state
 */
const EmptyStateContent = ({ queryFilter, pathname }: { queryFilter?: string, pathname: string }) => {
  if (queryFilter) {
    return <NoFilteredResults />;
  }

  const baseUrl = import.meta.env.BASE_URL;

  if (pathname.startsWith(`${baseUrl}/episodes`)) {
    return <NoEpisodesAvailable />;
  }

  if (pathname.startsWith(`${baseUrl}/series`)) {
    return (
      <ComponentResolver
        componentType="series:empty-state"
        defaultComponent={() => <NoSeriesAvailable />}
        componentProps={{}}
        loadingBehavior="none"
      />
    );
  }

  return <div>No results.</div>;
};

export { EmptyStateContent }