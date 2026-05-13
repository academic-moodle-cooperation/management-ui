import React from "react";

import { useI18n } from "@oc-mui/i18n";
import type {
  GetEventByIdInputFieldsQuery,
  GetInputFieldsMetaDataFragment,
} from "@oc-mui/query";
import {
  Button,
  Container,
  MetadataField,
  MetadataUpdateField,
  createMetadataHelpers,
  CopyIcon,
  PencilIcon,
} from "@oc-mui/ui/components";
import type { MetadataItem } from "@oc-mui/ui/config-primitives";
import { cn } from "@oc-mui/ui/lib/utils";
import { copyText } from "@oc-mui/utils";

import { episodesConfig } from "../config";

type EpisodesUpdateData = {
  [T: string]: string | string[];
};

interface EpisodesInfoContentProps {
  editEpisode: boolean;
  episodesUpdateData: EpisodesUpdateData | undefined;
  episodesInputFields: GetEventByIdInputFieldsQuery | undefined;
  setEpisodesUpdateData: (value: EpisodesUpdateData) => void;
  setUpdateField: (value: string) => void;
  updateField: string;
  textCopied?: boolean;
  setTextCopied?: () => void;
}

const EpisodesInfoContent = ({
  editEpisode,
  episodesUpdateData,
  episodesInputFields,
  setEpisodesUpdateData,
  setUpdateField,
  updateField,
  textCopied = false,
  setTextCopied,
}: EpisodesInfoContentProps) => {
  const { t } = useI18n();
  const metadata: MetadataItem[] = episodesConfig.use().episodeInfo?.metadata ?? [];

  // Use the createMetadataHelpers function to get visibility helpers
  const { isVisible, isReadOnly } = createMetadataHelpers(metadata);

  const handleCopyText = (text: string) => {
    copyText(text).then(() => {
      setTextCopied && setTextCopied();
    });
  };

  return (
    <>
      {episodesInputFields && (
        <>
          {Object.entries(episodesInputFields.eventById?.commonMetadataV2 || {})
            .map(([key, field]) => (field ? { ...field, id: key } : null))
            .filter(Boolean)
            .sort((a, b) => ((a?.order ?? 0) > (b?.order ?? 0) ? 1 : -1))
            .map((field: GetInputFieldsMetaDataFragment | null) => {
              if (!field?.id || !isVisible(field.id)) {
                return null;
              }
              return (
                <Container
                  key={field?.id}
                  onClick={
                    editEpisode && field && field.id && !field.readOnly && !isReadOnly(field.id)
                      ? () => setUpdateField(field.id ?? "")
                      : () => {}
                  }
                  className={cn(
                    editEpisode &&
                      field &&
                      field.id &&
                      !field.readOnly &&
                      !isReadOnly(field.id) &&
                      "cursor-pointer",
                  )}
                >
                  <div className="flex items-center space-x-2 text-sm font-medium uppercase text-muted-foreground">
                    {t(`episodes:episodesInfo.${field?.id}`)} {field?.required && "*"}
                    {editEpisode && !field?.readOnly && field?.id && !isReadOnly(field.id) && (
                      <Button variant="ghost" size="icon" className="w-4 h-4 ml-2">
                        <PencilIcon className="inline-flex group-hover:text-slate-700 text-slate-400" />
                        <span className="sr-only">{t(`common:edit`)}</span>
                      </Button>
                    )}
                  </div>
                  {editEpisode && updateField === field?.id ? (
                    <MetadataUpdateField
                      key={field?.id}
                      {...field}
                      value={episodesUpdateData?.[field.id] ?? field?.value}
                      onUpdate={(value) => {
                        if (field.id) {
                          setEpisodesUpdateData({
                            ...episodesUpdateData,
                            [field.id]: value,
                          });
                        }
                      }}
                    />
                  ) : field?.id === "identifier" ? (
                    <>
                      <div
                        title={t(`common:copy`)}
                        className="hover:cursor-pointer flex"
                        onClick={() => handleCopyText(field?.value as string)}
                      >
                        <>
                          <MetadataField
                            key={field?.id}
                            {...field}
                            value={(field?.id && episodesUpdateData?.[field?.id]) ?? field?.value}
                          />
                          <CopyIcon className="inline w-5 h-5 ml-2" />
                        </>
                      </div>
                      {textCopied && (
                        <p className="text-green-500 text-sm">
                          {t(`episodes:episodesInfo.identifierCopied`)}
                        </p>
                      )}
                    </>
                  ) : (
                    <MetadataField
                      key={field?.id}
                      {...field}
                      value={(field?.id && episodesUpdateData?.[field?.id]) ?? field?.value}
                    />
                  )}
                </Container>
              );
            })}
        </>
      )}
      {!episodesInputFields && (
        <div className="text-center text-muted-foreground">
          <p>{t("episodes:episodesInfo.noData")}</p>
        </div>
      )}
    </>
  );
};

export { EpisodesInfoContent };
