import React from "react";

import { usePluginTranslation } from "@oc-mui/i18n";

/**
 * Default Footer Component
 * Provides basic footer content that can be overridden by university extensions
 */
const DefaultFooter: React.FC = () => {
  const { t } = usePluginTranslation(["core-footer"]);
  return (
    <div className="flex w-full justify-between items-center">
      <span className="text-sm text-muted-foreground">Management UI v1.0.0</span>
      <span className="text-sm text-muted-foreground">© 2025</span>
      <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
        {t("core-footer:about")}
      </span>
    </div>
  );
};

export default DefaultFooter;
