import { formatDate, useI18n } from "@oc-mui/i18n";
import type { MetadataFieldType } from "@oc-mui/query";
import { parseDuration } from "@oc-mui/utils";

export const MetadataField = ({ type, listProvider, collection, value }: MetadataFieldType) => {
  const { t } = useI18n();

  // `collection` is `Maybe<JSON>` in the schema: a backend can legitimately
  // send a list-backed field without its option list (observed on a real
  // deployment for a read-only series field). Reading it unguarded threw
  // `Object.keys(undefined)` and took down the whole info panel.
  // The `JSON` scalar is opaque (`unknown`); a collection, when present, is a
  // label → value map.
  function getKeyByValue(object: unknown, value: unknown) {
    if (!object || typeof object !== "object") return undefined;
    const record = object as Record<string, unknown>;
    return Object.keys(record).find((key) => record[key] === value);
  }

  // `value` is the union of every field variant's scalar — string, string
  // list, Long, DateTime, JSON … — so render through its string form and only
  // reach for the structured value where a branch needs it.
  const displayValue = Array.isArray(value)
    ? value.join(",")
    : value === null || value === undefined
      ? ""
      : String(value);

  if (listProvider === "SERIES") {
    // Without the collection we cannot resolve the id to a title — show the
    // raw value rather than an empty field.
    return (
      <div className="text-sm text-foreground">
        {getKeyByValue(collection, value) ?? displayValue}
      </div>
    );
  } else if (listProvider === "LANGUAGES") {
    return (
      <div className="text-sm text-foreground">
        {displayValue !== "" ? t(`languages.${displayValue}`) : t(`noOptionSelected`)}
      </div>
    );
  } else if (listProvider === "LICENSES") {
    return (
      <div className="text-sm text-foreground">
        {displayValue !== "" ? t(`licences.${displayValue}`) : t(`noOptionSelected`)}
      </div>
    );
  }

  if (displayValue.length > 0) {
    let metadataElement = <>{displayValue}</>;
    switch (type) {
      case "TEXT":
        metadataElement = <>{displayValue}</>;
        break;
      case "TEXT_LONG":
        metadataElement = <div className="whitespace-pre-wrap">{displayValue}</div>;
        break;
      case "MIXED_TEXT":
        metadataElement = (
          <div className="whitespace-pre">
            <>
              {(Array.isArray(value) ? value : displayValue.split(",")).map((item) => (
                <>{(item ?? "") + "\n"}</>
              ))}
            </>
          </div>
        );
        break;
      case "DATE":
        metadataElement = <>{formatDate(displayValue)}</>;
        break;
      case "START_DATE":
        // Format START_DATE consistently with DATE (medium date, short time)
        metadataElement = <>{formatDate(displayValue)}</>;
        break;
      case "DURATION":
        metadataElement = <>{parseDuration(displayValue)}</>;
        break;

      default:
        metadataElement = <>{displayValue}</>;
        break;
    }
    return <div className="text-sm text-foreground">{metadataElement}</div>;
  } else {
    return <span className="text-sm text-foreground italic">{t(`noData`)}</span>;
  }
};
