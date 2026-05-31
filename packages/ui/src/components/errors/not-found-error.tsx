import { useTranslation } from "@oc-mui/i18n";

import { Button } from "../ui/button";

import { ErrorPage } from "./error-page";

export function NotFoundError({
  onBackClick,
  onHomeClick,
}: {
  onBackClick?: () => void;
  onHomeClick?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <ErrorPage
      code="404"
      title={t("errors.notFound.title")}
      description={t("errors.notFound.description")}
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
