import { useI18n } from "@oc-mui/i18n";

const EmptyState = () => {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="text-center my-16 flex flex-col items-center">
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
          {t("series:noSeriesAvailable.title")}
        </h4>
      </div>
    </div>
  );
};

export { EmptyState };
