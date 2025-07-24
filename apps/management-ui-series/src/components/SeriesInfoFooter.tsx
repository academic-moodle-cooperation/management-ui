import React from "react";
import { Button, toast } from "@workspace/ui/components";
import { useI18n } from "@workspace/i18n";
import {
  CommonSeriesMetadataV2,
  GetSeriesByIdInputFieldsQuery,
  useUpdateSeriesMutation,
} from "@workspace/query";
import { MetadataField } from "@workspace/ui-config";
import { normalizeMetadataObject } from "@workspace/utils";

type SeriesUpdateData = {
  [T: string]: string | string[];
};

interface SeriesInfoFooterProps {
  saveSeriesUpdate: ReturnType<typeof useUpdateSeriesMutation>;
  editSeries: boolean;
  seriesUpdateData: SeriesUpdateData | undefined;
  seriesInputFields: GetSeriesByIdInputFieldsQuery | undefined;
  onEditClose: () => void;
  selectedSeriesId: string;
  refetch: () => void;
  setEditSeries: (value: boolean) => void;
}

const SeriesInfoFooter = ({
  saveSeriesUpdate,
  editSeries,
  seriesUpdateData,
  seriesInputFields,
  onEditClose,
  selectedSeriesId,
  refetch,
  setEditSeries,
}: SeriesInfoFooterProps) => {
  const { t } = useI18n();

  const checkIfRequiredFieldsAreFilled = (metadata: Record<string, any>) => {
    const requiredFields = Object.values(seriesInputFields?.seriesById?.commonMetadataV2 || {}).filter(
      (field) => field?.required
    ).map((field) => field?.id).filter(Boolean) as string[];

    return (requiredFields && requiredFields.length === 0) || (requiredFields && requiredFields.every((fieldId: string) => metadata[fieldId]));
  };

  // Check if data has actually changed from original values
  const hasDataChanged = React.useMemo(() => {
    if (!seriesUpdateData || !seriesInputFields?.seriesById?.commonMetadataV2) {
      return false;
    }

    const originalData = seriesInputFields.seriesById.commonMetadataV2;

    // Compare each field in seriesUpdateData with original values
    return Object.entries(seriesUpdateData).some(([key, newValue]) => {
      const originalField = (originalData as any)[key];
      const originalValue = originalField?.value;

      // Handle different value types and normalize for comparison
      if (originalValue === undefined || originalValue === null) {
        return newValue !== "" && newValue !== undefined && newValue !== null;
      }

      // Convert both to strings for comparison to handle different types
      const normalizedOriginal = Array.isArray(originalValue) ? originalValue.join(',') : String(originalValue);
      const normalizedNew = Array.isArray(newValue) ? newValue.join(',') : String(newValue);

      return normalizedOriginal !== normalizedNew;
    });
  }, [seriesUpdateData, seriesInputFields]);

  const onSave = () => {
    let metadata = {
      title: seriesInputFields?.seriesById?.commonMetadataV2?.title?.value || "",
    };

    if (
      seriesUpdateData &&
      Object.hasOwn(seriesUpdateData, "contributor") &&
      seriesUpdateData.contributor?.length && seriesUpdateData.contributor.length > 0
    ) {
      seriesUpdateData.contributor = (
        Array.isArray(seriesUpdateData.contributor)
          ? seriesUpdateData.contributor.join(",")
          : seriesUpdateData.contributor
      )
        .replace(/\n/g, ",")
        .split(",")
        .filter((v: string) => v !== "")
        .filter((v: string) => v !== " ")
        .map((s: string) => s.trim());
    }
    if (
      seriesUpdateData &&
      Object.hasOwn(seriesUpdateData, "publisher") &&
      seriesUpdateData.publisher?.length && seriesUpdateData.publisher.length > 0
    ) {
      seriesUpdateData.publisher = (
        Array.isArray(seriesUpdateData.publisher)
          ? seriesUpdateData.publisher.join(",")
          : seriesUpdateData.publisher
      )
        .replace(/\n/g, ",")
        .split(",")
        .filter((v: string) => v !== "")
        .filter((v: string) => v !== " ")
        .map((s: string) => s.trim());
    }

    metadata = {
      ...metadata,
      ...seriesUpdateData,
    };

    // Normalize metadata to handle null/empty values consistently
    const normalizedMetadata = normalizeMetadataObject(metadata);

    // Ensure title is always present for the mutation
    const metadataWithTitle = {
      title: seriesInputFields?.seriesById?.commonMetadataV2?.title?.value || "",
      ...normalizedMetadata,
    };

    // Remove identifier if it exists (we don't want to update it)
    const { identifier, ...finalMetadata } = metadataWithTitle as any;


    if (!checkIfRequiredFieldsAreFilled(finalMetadata)) {
      toast.error(t("series:seriesTable.notification.fieldRequiredEmpty"));
    } else {
      saveSeriesUpdate.mutate(
        {
          seriesId: selectedSeriesId,
          metadata: finalMetadata,
        },
        {
          onSuccess: () => {
            toast.success(t("series:seriesTable.notification.changesSaved"));
            refetch();
          },
        }
      );

      onEditClose();
    }
  };

  return (
    <>
      {editSeries ? (
        <>
          <Button
            variant={"secondary"}
            size={"sm"}
            className=""
            onClick={onEditClose}
          >
            {t("common:cancel")}
          </Button>
          <Button
            variant={!hasDataChanged ? "secondary" : "default"}
            size={"sm"}
            className={
              !hasDataChanged ? "cursor-not-allowed" : "cursor-pointer"
            }
            onClick={onSave}
            disabled={!hasDataChanged}
          >
            {t("common:save")}
          </Button>
        </>
      ) : (
        <Button
          variant={"default"}
          size={"sm"}
          onClick={() => {
            setEditSeries(true);
          }}
        >
          {t("common:edit")}
        </Button>
      )}
    </>
  );
};

export { SeriesInfoFooter };
