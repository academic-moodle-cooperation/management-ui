import React, { useRef, RefObject, useState } from "react";
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
} from "@workspace/ui/components";
import { useClickOutside } from "@workspace/ui/hooks";
import {
  GetSeriesByIdInputFieldsQuery,
  useUpdateSeriesMutation,
  SeriesDataFragment,
} from "@workspace/query";
import { usePluginManager } from "@workspace/plugin-system";
import { SeriesInfoContent } from "./SeriesInfoContent";
import { SeriesInfoFooter } from "./SeriesInfoFooter";
import { SeriesUpdateData } from "../stores/sidebarStore";
import { useTranslation } from "@workspace/i18n";

interface SeriesTableSidebarProps {
  isOpen: boolean;
  onEditClose: () => void;
  heading: string;
  description?: string;
  seriesInputFields: GetSeriesByIdInputFieldsQuery | undefined;
  isLoadingMetadata: boolean;
  seriesUpdateData: SeriesUpdateData | undefined;
  updateField: string;
  isEditing: boolean;
  setSeriesUpdateData: (value: SeriesUpdateData | undefined) => void;
  setUpdateField: (value: string) => void;
  textCopied: boolean;
  setTextCopied: () => void;
  saveSeriesUpdate: ReturnType<typeof useUpdateSeriesMutation>;
  selectedSeriesId: string;
  refetch: () => void;
  setIsEditing: (value: boolean) => void;
  sidebarInfo?: string;
  tableRef: RefObject<HTMLDivElement | null>;
  currentSeries?: SeriesDataFragment | null;
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
      Array<{ component: React.ComponentType<Record<string, unknown>>; key: string; order: number }>
    >("renderer.getComponents", "table-sidebar:series:tabs") || [];

  // Sort components by order
  const sortedTabComponents = tabComponents.sort((a, b) => (a.order || 100) - (b.order || 100));
  const hasTabPlugins = sortedTabComponents.length > 0;

  console.log(
    `🎯 SeriesTableSidebar: Found ${sortedTabComponents.length} tab plugins, hasTabPlugins: ${hasTabPlugins}`
  );

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
                <TabsList className="mx-2 mb-4 grid w-auto grid-cols-2">
                  <TabsTrigger value="metadata">Metadata</TabsTrigger>
                  {sortedTabComponents.map((tabComponent) => (
                    <TabsTrigger key={tabComponent.key} value={tabComponent.key}>
                      {tabComponent.key
                        .replace(/^.*:/, "")
                        .replace(/-/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
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
                setEditSeries={setIsEditing}
              />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
