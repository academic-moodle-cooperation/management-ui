import React from "react";

import { usePluginTranslation, createOrganizationNamespace } from "@workspace/i18n";

/**
 * University of Vienna Footer Implementation
 * Migrated from migrate/extensions/src/univie/src/plugins/footer/Footer.tsx
 *
 * Displays University of Vienna specific footer with official links
 * Uses the new theme system and follows TU Wien pattern
 */
const UnivieFooter: React.FC = () => {
  const namespace = createOrganizationNamespace("univie", "footer");

  const { t } = usePluginTranslation([
    "core-footer", // Reuse core translations where possible
    namespace, // Add University of Vienna specific translations (univie-footer)
  ]);

  return (
    <div className="flex w-full justify-between items-center">
      {/* Left: ZID Link */}
      <div>
        <a
          href={t("univie-footer:zid_link")}
          className="text-xs text-white hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          {t("univie-footer:zid")}
        </a>
      </div>

      {/* Center: Empty space for flexibility */}
      <div className="flex items-center gap-4"></div>

      {/* Right: Legal Links */}
      <div className="flex flex-row items-center justify-center gap-2">
        <a
          className="text-xs text-white hover:underline mx-1"
          href={t("univie-footer:privacy_link")}
          target="_blank"
          rel="noreferrer"
        >
          {t("univie-footer:privacy")}
        </a>
        <a
          className="text-xs text-white hover:underline mx-1"
          href={t("univie-footer:imprint_link")}
          target="_blank"
          rel="noreferrer"
        >
          {t("univie-footer:imprint")}
        </a>
        <a
          className="text-xs text-white hover:underline mx-1"
          href={t("univie-footer:help_link")}
          target="_blank"
          rel="noreferrer"
        >
          {t("univie-footer:help")}
        </a>
      </div>
    </div>
  );
};

export { UnivieFooter };
