import React, { useRef, useState } from "react";

import { useTranslation } from "@oc-mui/i18n";
import { usePluginManager } from "@oc-mui/plugin-system";
import { useMuiUpdateEventMutation } from "@oc-mui/query";
import type { MuiGetEventByIdInputFieldsQuery, MuiEventsDataFragment } from "@oc-mui/query";
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

import { EpisodesInfoContent } from "./EpisodesInfoContent";
import { EpisodesInfoFooter } from "./EpisodesInfoFooter";

import type { EpisodesUpdateData } from "../stores/sidebarStore";
import type { RefObject } from "react";

interface EpisodesTableSidebarProps {
  isOpen: boolean;
  onEditClose: () => void;
  heading: string;
  description?: string | undefined;
  episodesInputFields: MuiGetEventByIdInputFieldsQuery | undefined;
  isLoadingMetadata: boolean;
  episodesUpdateData: EpisodesUpdateData | undefined;
  updateField: string;
  isEditing: boolean;
  setEpisodesUpdateData: (value: EpisodesUpdateData | undefined) => void;
  setUpdateField: (value: string) => void;
  textCopied: boolean;
  setTextCopied: () => void;
  saveEpisodeUpdate: ReturnType<typeof useMuiUpdateEventMutation>;
  selectedEpisodeId: string;
  refetch: () => void;
  refetchMetadata: () => void;
  setIsEditing: (value: boolean) => void;
  sidebarInfo?: string | undefined;
  tableRef: RefObject<HTMLDivElement | null>;
  currentEpisode?: MuiEventsDataFragment | undefined;
}

/**
 * Episodes-specific sidebar component for displaying and editing episodes metadata
 */
export const EpisodesTableSidebar: React.FC<EpisodesTableSidebarProps> = ({
  isOpen,
  onEditClose,
  heading,
  description = "",
  episodesInputFields,
  isLoadingMetadata,
  episodesUpdateData,
  updateField,
  isEditing,
  setEpisodesUpdateData,
  setUpdateField,
  textCopied,
  setTextCopied,
  saveEpisodeUpdate,
  selectedEpisodeId,
  refetch,
  refetchMetadata,
  setIsEditing,
  sidebarInfo,
  tableRef,
  currentEpisode,
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
        component: React.ComponentType<{
          selectedElement?: unknown;
          refetch?: () => void;
          onClose?: () => void;
        }>;
        key: string;
        order: number;
      }>
    >("renderer.getComponents", "table-sidebar:episodes:tabs") || [];

  // Sort components by order
  const sortedTabComponents = tabComponents.sort((a, b) => (a.order || 100) - (b.order || 100));
  const hasTabPlugins = sortedTabComponents.length > 0;

  logger.debug("EpisodesTableSidebar: Tab plugins found", {
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
                    <EpisodesInfoContent
                      editEpisode={isEditing}
                      episodesUpdateData={episodesUpdateData}
                      episodesInputFields={episodesInputFields}
                      setEpisodesUpdateData={setEpisodesUpdateData}
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
                        selectedElement={currentEpisode}
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
                <EpisodesInfoContent
                  editEpisode={isEditing}
                  episodesUpdateData={episodesUpdateData}
                  episodesInputFields={episodesInputFields}
                  setEpisodesUpdateData={setEpisodesUpdateData}
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
              <EpisodesInfoFooter
                saveEpisodeUpdate={saveEpisodeUpdate}
                editEpisode={isEditing}
                episodesUpdateData={episodesUpdateData}
                episodesInputFields={episodesInputFields}
                onEditClose={onEditClose}
                selectedEpisodeId={selectedEpisodeId}
                refetch={refetch}
                refetchMetadata={refetchMetadata}
                setEditEpisode={setIsEditing}
                currentEpisode={currentEpisode}
              />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
