import { useTranslation } from "@oc-mui/i18n";

import { Button } from "../ui/button";

import { ErrorPage } from "./error-page";

export function ForbiddenError({
  onHomeClick,
  onBackClick,
}: {
  onHomeClick?: () => void;
  onBackClick?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <ErrorPage
      code="403"
      title={t("errors.forbidden.title")}
      description={t("errors.forbidden.description")}
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
