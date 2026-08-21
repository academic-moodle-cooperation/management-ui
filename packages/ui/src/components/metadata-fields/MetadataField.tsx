import { formatDate, useI18n } from "@oc-mui/i18n";
import type { MetadataFieldType } from "@oc-mui/query";
import { parseDuration } from "@oc-mui/utils";

export const MetadataField = ({ type, listProvider, collection, value }: MetadataFieldType) => {
  const { t } = useI18n();

  // `collection` is `Maybe<JSON>` in the schema: a backend can legitimately
  // send a list-backed field without its option list (observed on a real
  // deployment for a read-only series field). Reading it unguarded threw
  // `Object.keys(undefined)` and took down the whole info panel.
  function getKeyByValue(object: Record<string, string> | null | undefined, value: string) {
    if (!object) return undefined;
    return Object.keys(object).find((key) => object[key] === value);
  }

  if (listProvider === "SERIES") {
    // Without the collection we cannot resolve the id to a title — show the
    // raw value rather than an empty field.
    return (
      <div className="text-sm text-foreground">{getKeyByValue(collection, value) ?? value}</div>
    );
  } else if (listProvider === "LANGUAGES") {
    return (
      <div className="text-sm text-foreground">
        {value !== null && value !== "" ? t(`languages.${value}`) : t(`noOptionSelected`)}
      </div>
    );
  } else if (listProvider === "LICENSES") {
    return (
      <div className="text-sm text-foreground">
        {value !== null && value !== "" ? t(`licences.${value}`) : t(`noOptionSelected`)}
      </div>
    );
  }

  if (value && value?.toString().length > 0) {
    let metadataElement = <>{value}</>;
    switch (type) {
      case "TEXT":
        metadataElement = <>{value}</>;
        break;
      case "TEXT_LONG":
        metadataElement = <div className="whitespace-pre-wrap">{value}</div>;
        break;
      case "MIXED_TEXT":
        metadataElement = (
          <div className="whitespace-pre">
            <>
              {(typeof value === "string" ? value.split(",") : value).map((item: string) => (
                <>{item + "\n"}</>
              ))}
            </>
          </div>
        );
        break;
      case "DATE":
        metadataElement = <>{formatDate(value)}</>;
        break;
      case "START_DATE":
        // Format START_DATE consistently with DATE (medium date, short time)
        metadataElement = <>{formatDate(value)}</>;
        break;
      case "DURATION":
        metadataElement = <>{parseDuration(value)}</>;
        break;

      default:
        metadataElement = <>{value}</>;
        break;
    }
    return <div className="text-sm text-foreground">{metadataElement}</div>;
  } else {
    return <span className="text-sm text-foreground italic">{t(`noData`)}</span>;
  }
};
