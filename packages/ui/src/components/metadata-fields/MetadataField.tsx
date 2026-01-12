import { useI18n } from "@workspace/i18n";
import { parseDuration } from "@workspace/utils";
import { MetadataFieldType } from "@workspace/query";

export const MetadataField = ({ type, listProvider, collection, value }: MetadataFieldType) => {
  const { t } = useI18n();

  function getKeyByValue(object: Record<string, string>, value: string) {
    return Object.keys(object).find((key) => object[key] === value);
  }

  if (listProvider === "SERIES") {
    return <div className="text-sm text-foreground">{getKeyByValue(collection, value)}</div>;
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
        metadataElement = (
          <>
            {new Intl.DateTimeFormat("de-DE", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date(value))}
          </>
        );
        break;
      case "START_DATE":
        //TODO: change that
        metadataElement = (
          <>
            {new Intl.DateTimeFormat("de-DE").format(new Date(value))}
            {/* {new Intl.DateTimeFormat("de-DE").format(
              new Date(value.split(";")[0].split("start=")[1])
            )} */}
          </>
        );
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
