import React from "react";

import { useI18n } from "@workspace/i18n";
import { useUpdateEventMutation } from "@workspace/query";
import type {
  GetEventByIdInputFieldsQuery,
  EventsDataFragment,
} from "@workspace/query";
import { Button, toast } from "@workspace/ui/components";
import { normalizeMetadataObject, logger } from "@workspace/utils";

type EpisodesUpdateData = {
  [T: string]: string | string[];
};

interface EpisodesInfoFooterProps {
  saveEpisodeUpdate: ReturnType<typeof useUpdateEventMutation>;
  editEpisode: boolean;
  episodesUpdateData: EpisodesUpdateData | undefined;
  episodesInputFields: GetEventByIdInputFieldsQuery | undefined;
  onEditClose: () => void;
  selectedEpisodeId: string;
  refetch: () => void;
  setEditEpisode: (value: boolean) => void;
  currentEpisode?: EventsDataFragment | undefined;
}

/**
 * Footer component for episodes info - handles edit/save/cancel buttons
 */
const EpisodesInfoFooter: React.FC<EpisodesInfoFooterProps> = ({
  saveEpisodeUpdate,
  editEpisode,
  episodesUpdateData,
  episodesInputFields,
  onEditClose,
  selectedEpisodeId,
  refetch,
  setEditEpisode,
  currentEpisode,
}) => {
  const { t } = useI18n();

  const checkIfRequiredFieldsAreFilled = (metadata: Record<string, unknown>) => {
    const requiredFields = Object.values(episodesInputFields?.eventById?.commonMetadataV2 || {})
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
        logger.debug("EpisodesInfoFooter: value is null, undefined, or empty", { fieldId, value });
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
    if (!episodesUpdateData || !episodesInputFields?.eventById?.commonMetadataV2) {
      return false;
    }

    const originalData = episodesInputFields.eventById.commonMetadataV2;

    // Compare each field in episodesUpdateData with original values
    const result = Object.entries(episodesUpdateData).some(([key, newValue]) => {
      const originalField = (originalData as Record<string, { value?: unknown } | undefined>)[key];
      const originalValue = originalField?.value;

      // Handle different value types and normalize for comparison
      if (originalValue === undefined || originalValue === null) {
        const hasChanged = newValue !== "" && newValue !== undefined && newValue !== null;
        return hasChanged;
      }

      // Convert both to strings for comparison to handle different types
      const normalizedOriginal = Array.isArray(originalValue)
        ? originalValue.join(",")
        : String(originalValue);
      const normalizedNew = Array.isArray(newValue) ? newValue.join(",") : String(newValue);

      const hasChanged = normalizedOriginal !== normalizedNew;
      return hasChanged;
    });
    return result;
  }, [episodesUpdateData, episodesInputFields]);

  // Check if episode is editable based on status
  const isEditable = React.useMemo(() => {
    const eventStatus = currentEpisode?.eventStatus;
    if (!eventStatus) return true;

    const status = eventStatus.split(".").pop()?.toUpperCase();
    return !(status === "PROCESSING" || status === "PENDING");
  }, [currentEpisode]);

  const onSave = () => {
    let metadata = {
      title: episodesInputFields?.eventById?.commonMetadataV2?.title?.value || "",
    };

    if (
      episodesUpdateData &&
      Object.hasOwn(episodesUpdateData, "contributor") &&
      episodesUpdateData["contributor"]?.length &&
      episodesUpdateData["contributor"].length > 0
    ) {
      episodesUpdateData["contributor"] = (
        Array.isArray(episodesUpdateData["contributor"])
          ? episodesUpdateData["contributor"].join(",")
          : episodesUpdateData["contributor"]
      )
        .replace(/\n/g, ",")
        .split(",")
        .filter((v: string) => v !== "")
        .filter((v: string) => v !== " ")
        .map((s: string) => s.trim());
    }
    if (
      episodesUpdateData &&
      Object.hasOwn(episodesUpdateData, "publisher") &&
      episodesUpdateData["publisher"]?.length &&
      episodesUpdateData["publisher"].length > 0
    ) {
      episodesUpdateData["publisher"] = (
        Array.isArray(episodesUpdateData["publisher"])
          ? episodesUpdateData["publisher"].join(",")
          : episodesUpdateData["publisher"]
      )
        .replace(/\n/g, ",")
        .split(",")
        .filter((v: string) => v !== "")
        .filter((v: string) => v !== " ")
        .map((s: string) => s.trim());
    }

    metadata = {
      ...metadata,
      ...episodesUpdateData,
    };

    // Normalize metadata to handle null/empty values consistently
    const normalizedMetadata = normalizeMetadataObject(metadata);

    // Use the normalized metadata directly - don't override with original values
    const metadataWithTitle = {
      ...normalizedMetadata,
    };

    // Remove identifier if it exists (we don't want to update it)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { identifier, ...finalMetadata } = metadataWithTitle as Record<string, unknown>;

    // IMPORTANT: Validate the merged metadata BEFORE normalization, because normalizeMetadataObject removes empty values
    // but we need to validate that required fields are not empty
    if (!checkIfRequiredFieldsAreFilled(metadata)) {
      toast.error(t("episodes:episodesTable.notification.fieldRequiredEmpty"));
    } else {
      saveEpisodeUpdate.mutate(
        {
          eventId: selectedEpisodeId,
          metadata: finalMetadata as { title: string; [key: string]: unknown },
        },
        {
          onSuccess: () => {
            toast.success(t("episodes:episodesTable.notification.changesSaved"));
            refetch();
          },
        },
      );

      onEditClose();
    }
  };

  return (
    <>
      {!isEditable ? (
        <div className="text-xs text-center text-muted-foreground">{t("episodes:notEditable")}</div>
      ) : editEpisode ? (
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
            setEditEpisode(true);
          }}
        >
          {t("common:edit")}
        </Button>
      )}
    </>
  );
};

export { EpisodesInfoFooter };
