import { useTranslation } from "@opencast-mui/i18n";

import { Button } from "../ui/button";

import { ErrorPage } from "./error-page";

export function UnauthorisedError({
  onBackClick,
  onHomeClick,
}: {
  onBackClick?: () => void;
  onHomeClick?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <ErrorPage
      code="401"
      title={t("errors.unauthorized.title")}
      description={t("errors.unauthorized.description")}
      actions={
        <>
          <Button variant="outline" onClick={onBackClick}>
            {t("goBack")}
          </Button>
          <Button onClick={onHomeClick}>{t("backToHome")}</Button>
        </>
      }
    />
  );
}
