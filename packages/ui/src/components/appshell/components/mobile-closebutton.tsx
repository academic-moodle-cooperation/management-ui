import { X } from "lucide-react";

import { useTranslation } from "@opencast-mui/i18n";

import { useSidebar } from "../../ui";

export const MobileCloseButton = () => {
  const { openMobile, setOpenMobile } = useSidebar();
  const { t } = useTranslation();

  if (!openMobile) return null;

  return (
    <div className="absolute top-0 flex justify-center w-16 pt-5 left-full">
      <button type="button" className="-m-2.5 p-2.5" onClick={() => setOpenMobile(false)}>
        <span className="sr-only">{t("a11y.closeSidebar")}</span>
        <X className="w-6 h-6 text-white" aria-hidden="true" />
      </button>
    </div>
  );
};
