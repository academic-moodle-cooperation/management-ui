import React from "react";
import { Button, toast } from "@workspace/ui/components";
import { useI18n } from "@workspace/i18n";
import {
  CommonEventMetadataV2,
  GetEventByIdInputFieldsQuery,
  useUpdateEventMutation,
  EventsDataFragment,
} from "@workspace/query";
import { MetadataField } from "@workspace/ui-config";
import { normalizeMetadataObject } from "@workspace/utils";

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
  currentEpisode?: EventsDataFragment;
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
  currentEpisode
}) => {
  const { t } = useI18n();

  const checkIfRequiredFieldsAreFilled = (metadata: Record<string, any>) => {
    const requiredFields = Object.values(episodesInputFields?.eventById?.commonMetadataV2 || {}).filter(
      (field) => field?.required
    ).map((field) => field?.id).filter(Boolean) as string[];

    return (requiredFields && requiredFields.length === 0) || (requiredFields && requiredFields.every((fieldId: string) => metadata[fieldId]));
  };

  // Check if data has actually changed from original values
  const hasDataChanged = React.useMemo(() => {
    if (!episodesUpdateData || !episodesInputFields?.eventById?.commonMetadataV2) {
      return false;
    }

    const originalData = episodesInputFields.eventById.commonMetadataV2;

    // Compare each field in episodesUpdateData with original values
    return Object.entries(episodesUpdateData).some(([key, newValue]) => {
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
  }, [episodesUpdateData, episodesInputFields]);

  // Check if episode is editable based on status
  const isEditable = React.useMemo(() => {
    const eventStatus = currentEpisode?.eventStatus;
    if (!eventStatus) return true;

    const status = eventStatus.split('.').pop()?.toUpperCase();
    return !(status === 'PROCESSING' || status === 'PENDING');
  }, [currentEpisode]);

  const onSave = () => {
    let metadata = {
      title: episodesInputFields?.eventById?.commonMetadataV2?.title?.value || "",
    };

    if (
      episodesUpdateData &&
      Object.hasOwn(episodesUpdateData, "contributor") &&
      episodesUpdateData.contributor?.length && episodesUpdateData.contributor.length > 0
    ) {
      episodesUpdateData.contributor = (
        Array.isArray(episodesUpdateData.contributor)
          ? episodesUpdateData.contributor.join(",")
          : episodesUpdateData.contributor
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
      episodesUpdateData.publisher?.length && episodesUpdateData.publisher.length > 0
    ) {
      episodesUpdateData.publisher = (
        Array.isArray(episodesUpdateData.publisher)
          ? episodesUpdateData.publisher.join(",")
          : episodesUpdateData.publisher
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

    // Ensure title is always present for the mutation
    const metadataWithTitle = {
      title: episodesInputFields?.eventById?.commonMetadataV2?.title?.value || "",
      ...normalizedMetadata,
    };

    // Remove identifier if it exists (we don't want to update it)
    const { identifier, ...finalMetadata } = metadataWithTitle as any;


    if (!checkIfRequiredFieldsAreFilled(finalMetadata)) {
      toast.error(t("episodes:episodesTable.notification.fieldRequiredEmpty"))
    } else {
      saveEpisodeUpdate.mutate(
        {
          eventId: selectedEpisodeId,
          metadata: finalMetadata,
        },
        {
          onSuccess: () => {
            toast.success(t("episodes:episodesTable.notification.changesSaved"));
            refetch();
          },
        }
      );

      onEditClose();
    }
  };

  return (
    <>
      {!isEditable ? (
        <div className="text-xs text-center text-muted-foreground">
          {t("episodes:notEditable")}
        </div>
      ) : editEpisode ? (
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