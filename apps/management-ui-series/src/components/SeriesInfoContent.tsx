
import { useI18n } from "@workspace/i18n";
import { useAppConfig } from "@workspace/query";
import type {
  GetSeriesByIdInputFieldsQuery,
  GetInputFieldsMetaDataFragment,
} from "@workspace/query";
import {
  Button,
  Container,
  MetadataField,
  MetadataUpdateField,
  createMetadataHelpers,
  CopyIcon,
  PencilIcon,
} from "@workspace/ui/components";
import { cn } from "@workspace/ui/lib/utils";
import type { MetadataItem } from "@workspace/ui-config";
import { copyText } from "@workspace/utils";

type SeriesUpdateData = {
  [T: string]: string | string[];
};

interface SeriesInfoContentProps {
  editSeries: boolean;
  seriesUpdateData: SeriesUpdateData | undefined;
  seriesInputFields: GetSeriesByIdInputFieldsQuery | undefined;
  setSeriesUpdateData: (value: SeriesUpdateData) => void;
  setUpdateField: (value: string) => void;
  updateField: string;
  textCopied?: boolean;
  setTextCopied?: () => void;
}

const SeriesInfoContent = ({
  editSeries,
  seriesUpdateData,
  seriesInputFields,
  setSeriesUpdateData,
  setUpdateField,
  updateField,
  textCopied = false,
  setTextCopied,
}: SeriesInfoContentProps) => {
  const { t } = useI18n();
  const { config } = useAppConfig();
  const metadata = (config?.plugins?.["management-ui-series"]?.seriesInfo?.metadata ??
    []) as MetadataItem[];

  // Use the createMetadataHelpers function to get visibility helpers
  const { isVisible, isReadOnly } = createMetadataHelpers(metadata);

  const handleCopyText = (text: string) => {
    copyText(text).then(() => {
      setTextCopied && setTextCopied();
    });
  };

  return (
    <>
      {seriesInputFields &&
        Object.values(seriesInputFields.seriesById?.commonMetadataV2 || {})
          .sort((a, b) => ((a?.order ?? 0) > (b?.order ?? 0) ? 1 : -1))
          .map((field: GetInputFieldsMetaDataFragment | null) => {
            if (!field?.id || !isVisible(field.id)) {
              return null;
            }
            return (
              <Container
                key={field?.id}
                onClick={
                  editSeries && field && field.id && !field.readOnly && !isReadOnly(field.id)
                    ? () => setUpdateField(field.id)
                    : () => {}
                }
                className={cn(
                  editSeries &&
                    field &&
                    field.id &&
                    !field.readOnly &&
                    !isReadOnly(field.id) &&
                    "cursor-pointer",
                )}
              >
                <div className="flex items-center space-x-2 text-sm font-medium uppercase text-muted-foreground">
                  {t(`series:seriesInfo.${field?.id}`)} {field?.required && "*"}
                  {editSeries && !field?.readOnly && field?.id && !isReadOnly(field.id) && (
                    <Button variant="ghost" size="icon" className="w-4 h-4 ml-2">
                      <PencilIcon className="inline-flex group-hover:text-slate-700 text-slate-400" />
                      <span className="sr-only">{t(`common:edit`)}</span>
                    </Button>
                  )}
                </div>
                {editSeries && updateField === field?.id ? (
                  <MetadataUpdateField
                    key={field?.id}
                    {...field}
                    value={seriesUpdateData?.[field.id] ?? field?.value}
                    onUpdate={(value) => {
                      if (field.id) {
                        setSeriesUpdateData({
                          ...seriesUpdateData,
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
                          value={(field?.id && seriesUpdateData?.[field?.id]) ?? field?.value}
                        />
                        <CopyIcon className="inline w-5 h-5 ml-2" />
                      </>
                    </div>
                    {textCopied && (
                      <p className="text-green-500 text-sm">
                        {t(`series:seriesInfo.identifierCopied`)}
                      </p>
                    )}
                  </>
                ) : (
                  <MetadataField
                    key={field?.id}
                    {...field}
                    value={(field?.id && seriesUpdateData?.[field?.id]) ?? field?.value}
                  />
                )}
              </Container>
            );
          })}
    </>
  );
};

export { SeriesInfoContent };
