import React, { useRef, useState } from "react";

import { useExtensionLabels, useTranslation } from "@oc-mui/i18n";
import { usePluginManager } from "@oc-mui/plugin-system";
import { useMuiUpdateSeriesMutation } from "@oc-mui/query";
import type { MuiGetSeriesByIdInputFieldsQuery, MuiSeriesDataFragment } from "@oc-mui/query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Loading,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@oc-mui/ui/components";
import { useClickOutside } from "@oc-mui/ui/hooks";
import { logger } from "@oc-mui/utils";

import { SeriesInfoContent } from "./SeriesInfoContent";
import { SeriesInfoFooter } from "./SeriesInfoFooter";

import type { SeriesUpdateData } from "../stores/sidebarStore";
import type { RefObject } from "react";

interface SeriesTableSidebarProps {
  isOpen: boolean;
  onEditClose: () => void;
  heading: string;
  description?: string | undefined;
  seriesInputFields: MuiGetSeriesByIdInputFieldsQuery | undefined;
  isLoadingMetadata: boolean;
  seriesUpdateData: SeriesUpdateData | undefined;
  updateField: string;
  isEditing: boolean;
  setSeriesUpdateData: (value: SeriesUpdateData | undefined) => void;
  setUpdateField: (value: string) => void;
  textCopied: boolean;
  setTextCopied: () => void;
  saveSeriesUpdate: ReturnType<typeof useMuiUpdateSeriesMutation>;
  selectedSeriesId: string;
  refetch: () => void;
  refetchMetadata: () => void;
  setIsEditing: (value: boolean) => void;
  sidebarInfo?: string | undefined;
  tableRef: RefObject<HTMLDivElement | null>;
  currentSeries?: MuiSeriesDataFragment | null | undefined;
}

/**
 * Series-specific sidebar component for displaying and editing series metadata
 */
export const SeriesTableSidebar: React.FC<SeriesTableSidebarProps> = ({
  isOpen,
  onEditClose,
  heading,
  description = "",
  seriesInputFields,
  isLoadingMetadata,
  seriesUpdateData,
  updateField,
  isEditing,
  setSeriesUpdateData,
  setUpdateField,
  textCopied,
  setTextCopied,
  saveSeriesUpdate,
  selectedSeriesId,
  refetch,
  refetchMetadata,
  setIsEditing,
  sidebarInfo,
  tableRef,
  currentSeries,
}) => {
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const { t } = useTranslation();
  const manager = usePluginManager();
  const [activeTab, setActiveTab] = useState("metadata");

  useClickOutside([sheetRef, tableRef as RefObject<HTMLElement>], () => {
    if (isOpen) {
      onEditClose();
    }
  });

  // Plugin system integration - check for table sidebar plugins
  const tabComponents =
    manager.executeFunction<
      Array<{
        component: React.ComponentType<Record<string, unknown>>;
        key: string;
        order: number;
        label?: string;
      }>
    >("renderer.getComponents", "table-sidebar:series:tabs") || [];

  // Sort components by order
  const sortedTabComponents = tabComponents.sort((a, b) => (a.order || 100) - (b.order || 100));

  // See EpisodesTableSidebar: the caption comes from the registered `label`
  // (a translation key), falling back to one derived from the key.
  const labelFor = useExtensionLabels(sortedTabComponents);
  const hasTabPlugins = sortedTabComponents.length > 0;

  logger.debug("SeriesTableSidebar: Tab plugins found", {
    count: sortedTabComponents.length,
    hasTabPlugins,
  });

  return (
    <Sheet modal={false} open={isOpen}>
      <SheetContent className="flex flex-col h-full p-6">
        <div ref={sheetRef} className="flex flex-col h-full overflow-hidden">
          <SheetHeader className="pl-1">
            <SheetTitle className="text-lg font-bold">{heading}</SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-auto">
            {isLoadingMetadata ? (
              <div className="flex items-center justify-center h-full">
                <Loading className="h-8 w-8 border-3" centered={false}>
                  {t("loading.metadata")}
                </Loading>
              </div>
            ) : hasTabPlugins ? (
              // Render tabbed interface with plugin components
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                defaultValue="metadata"
                className="flex flex-col h-full"
              >
                {/*
                  One column per tab, computed rather than fixed: the count is
                  1 (metadata) plus however many tabs plugins contribute, and a
                  hardcoded `grid-cols-2` broke the bar as soon as a second
                  plugin registered one. Tailwind cannot generate class names
                  at runtime, so the track count is an inline style.
                */}
                <TabsList
                  className="mx-2 mb-4 grid w-auto"
                  style={{
                    gridTemplateColumns: `repeat(${sortedTabComponents.length + 1}, minmax(0, 1fr))`,
                  }}
                >
                  <TabsTrigger value="metadata">{t("series:seriesInfo.tabs.metadata")}</TabsTrigger>
                  {sortedTabComponents.map((tabComponent) => (
                    <TabsTrigger key={tabComponent.key} value={tabComponent.key}>
                      {labelFor(tabComponent)}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="metadata" className="flex-1 overflow-auto">
                  <div className="pl-1 pr-3 pt-4 space-y-8">
                    <SeriesInfoContent
                      editSeries={isEditing}
                      seriesUpdateData={seriesUpdateData}
                      seriesInputFields={seriesInputFields}
                      setSeriesUpdateData={setSeriesUpdateData}
                      setUpdateField={setUpdateField}
                      updateField={updateField}
                      textCopied={textCopied}
                      setTextCopied={setTextCopied}
                    />
                  </div>
                </TabsContent>

                {sortedTabComponents.map((tabComponent) => {
                  const TabComponent = tabComponent.component;
                  return (
                    <TabsContent
                      key={tabComponent.key}
                      value={tabComponent.key}
                      className="flex-1 overflow-auto"
                    >
                      <TabComponent
                        selectedElement={currentSeries}
                        refetch={refetch}
                        onClose={onEditClose}
                      />
                    </TabsContent>
                  );
                })}
              </Tabs>
            ) : (
              // Default single-panel layout when no plugins
              <div className="pl-1 pr-3 pt-8 space-y-8">
                <SeriesInfoContent
                  editSeries={isEditing}
                  seriesUpdateData={seriesUpdateData}
                  seriesInputFields={seriesInputFields}
                  setSeriesUpdateData={setSeriesUpdateData}
                  setUpdateField={setUpdateField}
                  updateField={updateField}
                  textCopied={textCopied}
                  setTextCopied={setTextCopied}
                />
              </div>
            )}
          </div>

          {sidebarInfo && activeTab === "metadata" && (
            <div className="flex justify-end text-xs text-muted-foreground p-2">{sidebarInfo}</div>
          )}

          {!isLoadingMetadata && activeTab === "metadata" && (
            <div className="flex justify-end shrink-0 mt-auto space-x-2">
              <SeriesInfoFooter
                saveSeriesUpdate={saveSeriesUpdate}
                editSeries={isEditing}
                seriesUpdateData={seriesUpdateData}
                seriesInputFields={seriesInputFields}
                onEditClose={onEditClose}
                selectedSeriesId={selectedSeriesId}
                refetch={refetch}
                refetchMetadata={refetchMetadata}
                setEditSeries={setIsEditing}
              />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
