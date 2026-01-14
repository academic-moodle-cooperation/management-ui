import React from "react";

import { usePluginTranslation, createOrganizationNamespace } from "@workspace/i18n";

/**
 * TU Wien Footer Implementation
 * Migrated from migrate/extensions/src/tuwien/src/plugins/footer/FooterPlugin.tsx
 *
 * Custom footer with TU Wien branding and external link icons
 */

// CSS styles for TU Wien footer
const footerStyles = `
  .tuwien-footer-links {
    flex-basis: 75%;
    flex-grow: 1;
  }

  .tuwien-footer-links ul {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    font-size: 13px;
    padding-left: 0;
    list-style-type: none;
    margin: 0;
  }

  .tuwien-footer-links ul li {
    padding: 0 0.75rem;
  }

  .tuwien-footer-links a,
  .tuwien-footer-links a:visited {
    color: #bdbdbd;
    text-decoration: none;
  }

  .tuwien-footer-links a:hover,
  .tuwien-footer-links a:focus {
    color: #fff;
  }

  .tuwien-footer-links [href^="https://"],
  .tuwien-footer-links [href^="http://"],
  .tuwien-footer-links a[href^="mailto:"] {
    display: inline-flex;
  }

  .tuwien-footer-links [href^="https://"]:after,
  .tuwien-footer-links [href^="http://"]:after {
    width: 0.75rem;
    height: 0.75rem;
    margin: auto 0 auto 2px;
    background-image: url("data:image/svg+xml;charset=utf8,%3Csvg width='12' height='12' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cpath d='M0 0h12v12H0z'/%3E%3Cpath d='M0 0h12v12H0z'/%3E%3Cpath d='M9.5 9.5h-7v-7H6v-1H2.5a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7c.55 0 1-.45 1-1V6h-1v3.5zM7 1.5v1h1.795L3.88 7.415l.705.705L9.5 3.205V5h1V1.5H7z' fill='%23000' fill-rule='nonzero'/%3E%3C/g%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-size: 100% 100%;
    content: " ";
    filter: invert(20%) sepia(81%) saturate(5391%) hue-rotate(187deg) brightness(86%) contrast(101%);
  }

  .tuwien-footer-links [href^="https://"]:hover:after,
  .tuwien-footer-links [href^="http://"]:hover:after,
  .tuwien-footer-links [href^="https://"]:active:after,
  .tuwien-footer-links [href^="http://"]:active:after {
    filter: invert(16%) sepia(56%) saturate(2063%) hue-rotate(174deg) brightness(93%) contrast(101%);
  }
`;

const TUWienFooter: React.FC = () => {
  const namespace = createOrganizationNamespace("tuwien", "footer");

  const { t } = usePluginTranslation([
    "core-footer", // Reuse core translations where possible
    namespace, // Add TU Wien specific translations (tuwien-footer)
  ]);

  return (
    <>
      {/* Inject the CSS styles */}
      <style dangerouslySetInnerHTML={{ __html: footerStyles }} />

      <div
        className="flex w-full justify-between items-center"
        style={{ backgroundColor: "var(--color-footer)" }}
      >
        {/* Left: Empty space for balance */}
        <div></div>

        {/* Center: Empty space for flexibility */}
        <div className="flex items-center gap-4"></div>

        {/* Right: TU Wien Footer Links */}
        <div className="tuwien-footer-links">
          <ul>
            <li>
              <a href={t("tuwien-footer:support_link")}>{t("tuwien-footer:support")}</a>
            </li>
            <li>
              <a href={t("tuwien-footer:imprint_link")}>{t("tuwien-footer:imprint")}</a>
            </li>
            <li>
              <a href={t("tuwien-footer:privacy_link")}>{t("tuwien-footer:privacy")}</a>
            </li>
            {/* Mix of university and core translations */}
            <li>
              <a href="/help">
                {t("core-footer:help")} {/* Reuse core translation */}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
};

export { TUWienFooter };
