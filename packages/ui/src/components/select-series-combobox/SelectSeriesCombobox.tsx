import React, { useEffect } from "react";

import {
  Command,
  CommandInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  InfiniteScroll,
} from "@workspace/ui/components";
import { cn } from "@workspace/ui/lib";
import { Loader2 } from "lucide-react";
import type { FetchNextPageOptions, InfiniteData, InfiniteQueryObserverResult } from "@workspace/query";
import { useI18n } from "@workspace/i18n";

type Series = {
  id: string | null | undefined;
  title: string | null | undefined;
};

const SelectSeriesCombobox = ({
  disableSearch,
  seriesList,
  setSelectedSeries,
  selectedSeries,
  infiniteFetchNextPage,
  hasNextPage,
  searchSeries,
  placeholder,
}: {
  disableSearch?: boolean;
  seriesList: Series[] | undefined;
  setSelectedSeries: (value: Series | null) => void;
  infiniteFetchNextPage?: (
    options?: FetchNextPageOptions
  ) => Promise<InfiniteQueryObserverResult<InfiniteData<unknown, unknown>, Error>>;
  hasNextPage?: boolean;
  searchSeries?: (query: React.SetStateAction<string>) => void;
  selectedSeries: Series | null | undefined;
  placeholder: string;
}) => {
  const [filter, setFilter] = React.useState<string>("");
  const [seriesListFiltered, setSeriesListFiltered] = React.useState<Series[] | undefined>();

  const [loading, setLoading] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);

  const { t } = useI18n();

  useEffect(() => {
    setSeriesListFiltered(seriesList);
    setHasMore(hasNextPage || false);
  }, [seriesList, hasNextPage]);

  const next = async () => {
    setLoading(true);

    /**
     * Intentionally delay the search by 800ms before execution so that you can see the loading spinner.
     * In your app, you can remove this setTimeout.
     **/
    const data = infiniteFetchNextPage && (await infiniteFetchNextPage());

    // Usually your response will tell you if there is no more data.
    if (!data?.hasNextPage) {
      setHasMore(false);
    }
    setLoading(false);
  };

  return (
    <>
      <Select
        onValueChange={(value) => {
          setSelectedSeries(seriesList?.find((data) => data.id === value) || null);
        }}
        value={selectedSeries?.title || ""}
      >
        <SelectTrigger
          className={cn("justify-between w-full", !selectedSeries?.id && "text-muted-foreground")}
        >
          <SelectValue placeholder={placeholder}>
            {selectedSeries?.title || placeholder}
          </SelectValue>
        </SelectTrigger>

        <SelectContent className="sidebar-portal-inside">
          <Command className="h-auto">
            {!disableSearch && (
              <CommandInput
                placeholder={placeholder}
                onInput={(e) => {
                  setFilter(e.currentTarget.value);

                  // searchSeries(e.currentTarget.value);
                  searchSeries && searchSeries(e.currentTarget.value);
                  // setSeriesListFiltered(
                  //   seriesList?.filter((series) =>
                  //     series.title?.toLowerCase().includes(filter?.toLowerCase())
                  //   )
                  // );
                  // if (e.currentTarget.value === "") {
                  //   setHasMore(true);
                  // }
                }}
                // onValueChange={(value) => {
                //   setFilter(value);
                //   searchSeries(value);
                // }}
                value={filter}
                onKeyDownCapture={(e) => {
                  if (e.key === "Escape") {
                    setSeriesListFiltered(seriesList);
                    setFilter("");
                  } else if (e.key === "Enter" || e.key === "Tab") {
                    e.currentTarget.blur();
                  } else {
                    e.stopPropagation();
                  }
                }}
                tabIndex={0}
              />
            )}
            {/* <DebouncedInput
              placeholder={t("search")}
              value={filter ?? ""}
              // onChange={(event) => {
              //   setQueryFilter(event.target.value);
              // }}
              className="h-8 w-[150px] lg:w-[250px]"
              onChange={(value) => {
                setFilter(String(value));
                searchSeries(String(value));
              }}
              onChangeCapture={(e) => {
                // setPageIndex(0);
                searchSeries(e.currentTarget.value);
              }}
              type="text"
              autoFocus={filter.length > 0 ? true : false}
            /> */}
            {seriesListFiltered?.length ? (
              seriesListFiltered.map(
                (series) =>
                  series.id && (
                    <SelectItem key={series.id} value={series.id} tabIndex={0}>
                      {series.title}
                    </SelectItem>
                  )
              )
            ) : (
              <span className="flex items-center justify-center m-4 text-sm">
                {t("noEntriesHeading")}
              </span>
            )}
            {infiniteFetchNextPage && (
              <InfiniteScroll hasMore={hasMore} isLoading={loading} next={next} threshold={0}>
                {hasMore && <Loader2 className="my-4 h-6 animate-spin w-full" />}
              </InfiniteScroll>
            )}
          </Command>
        </SelectContent>
      </Select>
    </>
  );
};

export { SelectSeriesCombobox };
