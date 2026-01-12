import React from "react";
import { Button, Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components";
import { Pencil, UploadCloud } from "lucide-react";
import { Link } from "@workspace/router";
import { i18next } from "@workspace/i18n";
import { useSidebarStore } from "../stores/sidebarStore";
import { SeriesDataFragment } from "@workspace/query";
import { PluginComponent } from "@workspace/plugin-system";

interface SeriesActionsCellProps {
  series: SeriesDataFragment;
}

const DefaultSeriesActionsCell: React.FC<SeriesActionsCellProps> = ({ series }) => {
  const { openSidebarWithData } = useSidebarStore();

  return (
    <div className="flex items-center justify-center gap-2">
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="w-4 h-4"
            onClick={(e) => {
              e.stopPropagation();
              openSidebarWithData(series.id, true, {});
            }}
          >
            <Pencil />
            <span className="sr-only">{i18next.t("series:seriesTable.action.editData")}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>{i18next.t("series:seriesTable.action.editData")}</TooltipContent>
      </Tooltip>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Link
            to={`${import.meta.env.BASE_URL}/upload/${series.id}`}
            className="flex items-center justify-end group"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Button variant="ghost" size="icon" className="w-4 h-4">
              <UploadCloud />
              <span className="sr-only">Upload</span>
            </Button>
          </Link>
        </TooltipTrigger>
        <TooltipContent>Upload</TooltipContent>
      </Tooltip>
    </div>
  );
};

// Main pluggable component
export const SeriesActionsCell: React.FC<SeriesActionsCellProps> = (props) => {
  return (
    <PluginComponent
      componentType="series:table:actions"
      pluginProps={{
        series: props.series,
      }}
    >
      <DefaultSeriesActionsCell {...props} />
    </PluginComponent>
  );
};

export default SeriesActionsCell;
