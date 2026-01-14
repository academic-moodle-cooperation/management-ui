import React from "react";
import { Button, toast } from "@workspace/ui/components";
import { useI18n } from "@workspace/i18n";
import { useUpdateSeriesMutation } from "@workspace/query";
import type { CommonSeriesMetadataV2, GetSeriesByIdInputFieldsQuery } from "@workspace/query";
import type { MetadataField } from "@workspace/ui-config";
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

  const checkIfRequiredFieldsAreFilled = (metadata: Record<string, unknown>) => {
    const requiredFields = Object.values(seriesInputFields?.seriesById?.commonMetadataV2 || {})
      .filter((field) => field?.required)
      .map((field) => field?.id)
      .filter(Boolean) as string[];

    // If no required fields, validation passes
    if (!requiredFields || requiredFields.length === 0) {
      return true;
    }

    // Check that all required fields have non-empty values
    return requiredFields.every((fieldId: string) => {
      const value = metadata[fieldId];
      // Check for null, undefined, empty string, or empty array
      if (value === null || value === undefined || value === "") {
        return false;
      }
      // For arrays, check if they have content
      if (Array.isArray(value)) {
        return (
          value.length > 0 &&
          value.some((item) => item !== null && item !== undefined && String(item).trim() !== "")
        );
      }
      // For strings, check if they're not just whitespace
      return String(value).trim() !== "";
    });
  };

  // Check if data has actually changed from original values
  const hasDataChanged = React.useMemo(() => {
    if (!seriesUpdateData || !seriesInputFields?.seriesById?.commonMetadataV2) {
      return false;
    }

    const originalData = seriesInputFields.seriesById.commonMetadataV2;

    // Compare each field in seriesUpdateData with original values
    return Object.entries(seriesUpdateData).some(([key, newValue]) => {
      const originalField = (originalData as Record<string, { value?: unknown } | undefined>)[key];
      const originalValue = originalField?.value;

      // Handle different value types and normalize for comparison
      if (originalValue === undefined || originalValue === null) {
        return newValue !== "" && newValue !== undefined && newValue !== null;
      }

      // Convert both to strings for comparison to handle different types
      const normalizedOriginal = Array.isArray(originalValue)
        ? originalValue.join(",")
        : String(originalValue);
      const normalizedNew = Array.isArray(newValue) ? newValue.join(",") : String(newValue);

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
      seriesUpdateData["contributor"]?.length &&
      seriesUpdateData["contributor"].length > 0
    ) {
      seriesUpdateData["contributor"] = (
        Array.isArray(seriesUpdateData["contributor"])
          ? seriesUpdateData["contributor"].join(",")
          : seriesUpdateData["contributor"]
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
      seriesUpdateData["publisher"]?.length &&
      seriesUpdateData["publisher"].length > 0
    ) {
      seriesUpdateData["publisher"] = (
        Array.isArray(seriesUpdateData["publisher"])
          ? seriesUpdateData["publisher"].join(",")
          : seriesUpdateData["publisher"]
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
    // Use the normalized metadata (which includes seriesUpdateData) and only fallback to original if truly missing
    const metadataWithTitle = {
      title:
        normalizedMetadata["title"] ||
        seriesInputFields?.seriesById?.commonMetadataV2?.title?.value ||
        "",
      ...normalizedMetadata,
    };

    // Remove identifier if it exists (we don't want to update it)
    const { identifier, ...restMetadata } = metadataWithTitle as Record<string, unknown>;
    // Ensure title is always present (required by CommonSeriesMetadataInput)
    const finalMetadata = {
      title: metadataWithTitle.title || "",
      ...restMetadata,
    };

    // IMPORTANT: Validate the merged metadata BEFORE normalization, because normalizeMetadataObject removes empty values
    // but we need to validate that required fields are not empty
    if (!checkIfRequiredFieldsAreFilled(metadata)) {
      toast.error(t("series:seriesTable.notification.fieldRequiredEmpty"));
    } else {
      saveSeriesUpdate.mutate(
        {
          seriesId: selectedSeriesId,
          metadata: finalMetadata as { title: string; [key: string]: unknown },
        },
        {
          onSuccess: () => {
            toast.success(t("series:seriesTable.notification.changesSaved"));
            refetch();
          },
        },
      );

      onEditClose();
    }
  };

  return (
    <>
      {editSeries ? (
        <>
          <Button variant={"secondary"} size={"sm"} className="" onClick={onEditClose}>
            {t("common:cancel")}
          </Button>
          <Button
            variant={!hasDataChanged ? "secondary" : "default"}
            size={"sm"}
            className={!hasDataChanged ? "cursor-not-allowed" : "cursor-pointer"}
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
