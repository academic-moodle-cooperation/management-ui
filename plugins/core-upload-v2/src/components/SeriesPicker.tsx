import { Check, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";

import { useI18n } from "@oc-mui/i18n";
import {
  createGraphQLClient,
  MuiGetMySeriesNameAndIdDocument,
  OrderDirection,
  useAppConfig,
  useInfiniteQuery,
} from "@oc-mui/query";
import type { MuiGetMySeriesNameAndIdQuery } from "@oc-mui/query";
import {
  Button,
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@oc-mui/ui/components";


export type SelectedSeries = { id: string; title: string };

const PAGE_SIZE = 100;

/**
 * Series selection for the header bar, built as a Popover + cmdk combobox.
 *
 * Deliberately NOT the shared `SelectSeriesCombobox`: that component needs a
 * second, non-paginated copy of the series query alongside the infinite one to
 * fill its list, and its Radix-Select-inside-cmdk nesting leaves the rendered
 * `value` (title) diverging from the item values (ids). A plain Popover + cmdk
 * combobox needs one query, gives search for free, and keeps selection in one
 * event model.
 *
 * Data: the same central `MuiGetMySeriesNameAndId` document v1 uses, through
 * one infinite query. Search is server-side (the `query` variable), so the
 * list stays correct beyond the first page.
 */
export const SeriesPicker = ({
  selected,
  onSelect,
}: {
  selected: SelectedSeries | null;
  onSelect: (series: SelectedSeries | null) => void;
}) => {
  const { t } = useI18n("upload-v2");
  const { config } = useAppConfig();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data, fetchNextPage, hasNextPage, isFetching } = useInfiniteQuery({
    queryKey: ["upload-v2", "seriesList", search],
    queryFn: async ({ pageParam }) => {
      const client = createGraphQLClient(config.api.graphqlEndpoint);
      const result = (await client.request(MuiGetMySeriesNameAndIdDocument, {
        limit: PAGE_SIZE,
        offset: pageParam,
        query: search || undefined,
        orderBy: { title: OrderDirection.Asc },
      })) as MuiGetMySeriesNameAndIdQuery;
      return result?.currentUser?.mySeries?.nodes ?? [];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.length < PAGE_SIZE ? undefined : lastPageParam + PAGE_SIZE,
  });

  const seriesList = useMemo(
    () =>
      (data?.pages.flat() ?? []).flatMap((series) =>
        series?.id && series.title ? [{ id: series.id, title: series.title }] : [],
      ),
    [data],
  );

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label className="text-muted-foreground text-xs">{t("series.label")}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={`w-full justify-between font-normal ${
              selected ? "" : "text-muted-foreground"
            }`}
          >
            <span className="truncate">{selected?.title ?? t("series.placeholder")}</span>
            <ChevronsUpDown className="size-4 shrink-0 opacity-50" aria-hidden />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={t("series.searchPlaceholder")}
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {!isFetching && <CommandEmpty>{t("series.empty")}</CommandEmpty>}
              {seriesList.map((series) => (
                <CommandItem
                  key={series.id}
                  value={series.id}
                  onSelect={() => {
                    // Re-selecting the current entry clears it — cheap way to
                    // allow "no series" without an extra affordance.
                    onSelect(selected?.id === series.id ? null : series);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={`size-4 ${selected?.id === series.id ? "opacity-100" : "opacity-0"}`}
                    aria-hidden
                  />
                  <span className="truncate">{series.title}</span>
                </CommandItem>
              ))}
              {hasNextPage && (
                <CommandItem value="__more__" onSelect={() => void fetchNextPage()}>
                  <span className="text-muted-foreground">{t("series.loadMore")}</span>
                </CommandItem>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
