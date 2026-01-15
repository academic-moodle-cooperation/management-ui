import { ChevronDown } from "lucide-react";
import React, { useState } from "react";

import { useI18n } from "@workspace/i18n";
import {
  useInfiniteQuery,
  createGraphQLClient,
  gql,
  type MetadataFieldType,
  OrderDirection,
  type GetMySeriesNameAndIdQuery,
  type Series,
} from "@workspace/query";
import { useAppConfig } from "@workspace/query";
import {
  // Badge,
  // Button,
  // cn,
  Input,
  Select,
  SelectContent,
  SelectItem,
  // SelectMulti,
  SelectSeriesCombobox,
  SelectTrigger,
  SelectValue,
  Textarea,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Button,
  DatePicker,
  TimePicker,
} from "@workspace/ui/components";
import { serializeDuration } from "@workspace/utils";

type MetadataUpdateFieldProps = MetadataFieldType & {
  value: string | string[];
  onUpdate: (value: string | string[]) => void;
};

export const MetadataUpdateField = ({
  type,
  value,
  listProvider,
  collection,
  onUpdate,
}: MetadataUpdateFieldProps) => {
  const [openLangSelect, setOpenLangSelect] = useState(false);
  const [query, setQuery] = useState<string | undefined>(undefined);
  const { t } = useI18n();
  const { config } = useAppConfig();

  // const { isLoading: isLoadingSeriesData, data: seriesData } =
  //   useGetMySeriesNameAndIdQuery({
  //     query,
  //   });

  // const seriesList = useMemo(
  //   () =>
  //     seriesData?.currentUser.mySeries.nodes?.map((series) => {
  //       return { id: series?.id, title: series?.title };
  //     }) || [],
  //   [seriesData]
  // );

  const FETCH_MY_SERIES = gql`
    query GetMySeriesNameAndId(
      $limit: Int
      $offset: Int
      $orderBy: SeriesOrderByInput
      $query: String
    ) {
      currentUser {
        mySeries(limit: $limit, offset: $offset, orderBy: $orderBy, query: $query) {
          nodes {
            id
            title
          }
        }
      }
    }
  `;

  const fetchMySeries = async ({
    pageParam = 0,
    query,
  }: {
    pageParam: number;
    query: string | undefined;
  }) => {
    const graphQLClient = createGraphQLClient(config.api.graphqlEndpoint);
    const data: GetMySeriesNameAndIdQuery | undefined = await graphQLClient.request(
      FETCH_MY_SERIES,
      {
        limit: 10,
        offset: pageParam,
        query,
        orderBy: {
          title: OrderDirection.Asc,
        },
      },
    );
    return data?.currentUser?.mySeries.nodes;
  };

  const { data, fetchNextPage, hasNextPage, isLoading } = useInfiniteQuery({
    queryKey: ["seriesList", query],
    queryFn: ({ pageParam }) => {
      return fetchMySeries({ pageParam, query });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages, lastPageParam) => {
      if (!lastPage || lastPage.length === 0 || lastPage.length < 10) {
        return undefined;
      }
      return lastPageParam + 10;
    },
  });

  // TODO: CONTRIBUTORS field implementation is work in progress
  // const [selectedContributors, setSelectedContributors] = useState<Map<string, string>>(new Map());

  // if (listProvider === "SERIES" && !isLoadingSeriesData) {
  // if (listProvider === "SERIES" && !isLoading) {
  //   return (
  //     <>
  //       <SelectSeriesCombobox
  //         disableSearch={true}
  //         seriesList={data?.pages.flat()}
  //         selectedSeries={data?.pages
  //           .flat()
  //           .find((series) => series.id === value)}
  //         setSelectedSeries={(el) => {
  //           onUpdate(el?.id || "");
  //         }}
  //         searchSeries={setQuery}
  //         infiniteFetchNextPage={fetchNextPage}
  //         hasNextPage={hasNextPage}
  //         placeholder={"Select a series"}
  //       />
  //     </>
  //   );
  // }
  if (listProvider && !isLoading) {
    switch (listProvider) {
      case "LANGUAGES":
        return (
          <>
            <Popover open={openLangSelect} onOpenChange={setOpenLangSelect}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between">
                  {value ? t(`languages.${value}`) : t(`noOptionSelected`)}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] sidebar-portal-inside p-0">
                <Command
                  filter={(value, search) => {
                    // Convert both the translated value and search to lowercase for case-insensitive comparison
                    const translatedValue = t(`languages.${value}`).toLowerCase();
                    return translatedValue.includes(search.toLowerCase()) ? 1 : 0;
                  }}
                >
                  <CommandInput placeholder={t(`noOptionSelected`)} />
                  <CommandList>
                    <CommandEmpty>{t(`noOptionSelected`)}</CommandEmpty>
                    <CommandGroup>
                      {Object.values(collection).length ? (
                        Object.values(collection)
                          .sort((a, b) => t(`languages.${a}`).localeCompare(t(`languages.${b}`)))
                          .map((item) => (
                            <CommandItem
                              key={t(`languages.${item}`)}
                              value={item as string}
                              onSelect={(value) => {
                                onUpdate(value);
                                setOpenLangSelect(false); // Close the popup after selection
                              }}
                            >
                              {t(`languages.${item}`)}
                            </CommandItem>
                          ))
                      ) : (
                        <CommandEmpty>{t(`noOptionSelected`)}</CommandEmpty>
                      )}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </>
        );
      case "LICENSES":
        return (
          <>
            <Select
              onValueChange={(value) => {
                onUpdate(value);
              }}
              value={value}
            >
              <SelectTrigger>
                <SelectValue placeholder={t(`noOptionSelected`)}>
                  {value ? t(`licences.${value}`) : t(`noOptionSelected`)}
                </SelectValue>
              </SelectTrigger>

              <SelectContent className="sidebar-portal-inside">
                {Object.values(collection).length ? (
                  Object.values(collection).map((item, index) => (
                    <SelectItem key={index + (item as string)} value={item as string} tabIndex={0}>
                      {t(`licences.${item}`)}
                    </SelectItem>
                  ))
                ) : (
                  <span className="flex items-center justify-center m-4 text-sm">
                    {t(`noOptionSelected`)}
                  </span>
                )}
              </SelectContent>
            </Select>
          </>
        );

      case "SERIES":
        return (
          <>
            <SelectSeriesCombobox
              disableSearch={true}
              seriesList={
                data?.pages.flat().filter((series) => series !== null) as Series[] | undefined
              }
              selectedSeries={data?.pages.flat().find((series) => series?.id === value)}
              setSelectedSeries={(el) => {
                onUpdate(el?.id || "");
              }}
              searchSeries={(query) => setQuery(query as string)}
              infiniteFetchNextPage={fetchNextPage}
              hasNextPage={hasNextPage}
              placeholder={"Select a series"}
            />
          </>
        );
      // TODO: CONTRIBUTORS field implementation is work in progress
      // case "CONTRIBUTORS":
      //   return (
      //     <>
      //       <SelectMulti
      //         items={Object.values(collection)}
      //         selectedItems={Array.from(selectedContributors.values())}
      //         onSelect={({ item, checked }) => {
      //           setSelectedContributors((prevMap) => {
      //             const newMap = new Map(prevMap);
      //             if (checked) {
      //               newMap.set(item, item);
      //             } else {
      //               newMap.delete(item);
      //             }
      //             return newMap;
      //           });
      //         }}
      //       >
      //         {/* <Button variant="outline">Open</Button> */}
      //         {/* <div className="flex w-full max-w-sm items-center space-x-2"> */}
      //         <div className="flex h-10 items-center rounded-md border border-input bg-white pr-3 text-sm ring-offset-background focus-within:ring-1 focus-within:ring-ring focus-within:ring-offset-2">
      //           <Input
      //             type="email"
      //             placeholder="Email"
      //             className="w-full p-2 placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      //           />
      //           <Button className="h-2 mx-2" variant="outline">
      //             Add
      //           </Button>
      //           <ChevronDown className="w-4 h-4" />
      //         </div>
      //       </SelectMulti>
      //       {value.map((contributor) => (
      //         <Badge key={contributor} variant="outline">
      //           {contributor}
      //         </Badge>
      //       ))}
      //     </>
      //   );
    }
  }
  let metadataElement = <>{value}</>;
  switch (type) {
    case "TEXT":
      metadataElement = (
        <Input
          type="text"
          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          value={value || ""}
          onChange={(e) => {
            onUpdate(e.target.value);
          }}
        />
      );
      break;
    case "TEXT_LONG":
      metadataElement = (
        <Textarea
          rows={3}
          className="block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          value={value || ""}
          onChange={(e) => {
            onUpdate(e.target.value);
          }}
        />
      );
      break;
    case "MIXED_TEXT":
      metadataElement = (
        <>
          <Textarea
            rows={3}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={value || []}
            onChange={(e) => {
              onUpdate(e.target.value);
            }}
          />
          <span className="text-xs text-gray-400">{t(`sepatateValues`)}</span>
        </>
      );
      break;
    case "DATE":
      metadataElement = (
        <>
          <DatePicker
            date={new Date(value as string)}
            onDateChange={(date) => onUpdate(date?.toISOString() || "")}
          >
            <span>Pick a Date</span>
          </DatePicker>
        </>
      );
      break;
    case "START_DATE":
      // START_DATE uses same DatePicker as DATE for consistency
      // Note: If time selection is needed in the future, consider using DateTimePicker
      metadataElement = (
        <>
          <DatePicker
            date={new Date(value as string)}
            onDateChange={(date) => onUpdate(date?.toISOString() || "")}
          >
            <span>Pick a Date</span>
          </DatePicker>
        </>
      );
      break;
    case "DURATION":
      metadataElement = (
        <TimePicker
          className="ring-1 ring-inset ring-gray-300"
          granularity="second"
          shouldForceLeadingZeros
          hourCycle={24}
          onChange={(value) => {
            const duration: { hours?: number; minutes?: number; seconds?: number } = {};
            if (value?.hour !== undefined) duration.hours = value.hour;
            if (value?.minute !== undefined) duration.minutes = value.minute;
            if (value?.second !== undefined) duration.seconds = value.second;
            onUpdate(serializeDuration(duration));
          }}
        />
      );
      break;

    default:
      metadataElement = (
        <Input
          type="text"
          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          value={value || ""}
          onChange={(e) => onUpdate(e.target.value)}
        />
      );
      break;
  }
  return metadataElement;
};
