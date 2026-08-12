import React from "react";

import { usePluginTranslation } from "@oc-mui/i18n";
import { Link } from "@oc-mui/router";

// Injected at build time via Vite `define` (see apps/shell/vite.config.ts).
// `typeof` guards keep this rendering sensibly when the define is absent
// (unit tests, Storybook) — version falls back, commit link is omitted.
declare const __APP_VERSION__: string;
declare const __GIT_COMMIT__: string;
const APP_VERSION = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "1.0.0";
const GIT_COMMIT = typeof __GIT_COMMIT__ !== "undefined" ? __GIT_COMMIT__ : "";
const REPO_URL = "https://github.com/academic-moodle-cooperation/management-ui";

/**
 * Default Footer Component
 * Provides basic footer content that can be overridden by university extensions
 */
const DefaultFooter: React.FC = () => {
  const { t } = usePluginTranslation(["core-footer"]);
  return (
    <div className="flex w-full justify-between items-center">
      <span className="text-sm text-muted-foreground">
        Management UI v{APP_VERSION}
        {GIT_COMMIT ? (
          <>
            {" · "}
            <a
              href={`${REPO_URL}/commit/${GIT_COMMIT}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono underline-offset-2 transition-colors hover:text-foreground hover:underline"
            >
              {GIT_COMMIT}
            </a>
          </>
        ) : null}
      </span>
      <span className="text-sm text-muted-foreground">© {new Date().getFullYear()}</span>
      <Link
        to="/"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {t("core-footer:about")}
      </Link>
    </div>
  );
};

export default DefaultFooter;
