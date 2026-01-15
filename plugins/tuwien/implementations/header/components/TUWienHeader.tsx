import React, { useEffect } from "react";

import { useI18n, loadNamespace } from "@workspace/i18n";
import { Button, useSidebar } from "@workspace/ui/components";
import { Menu } from "@workspace/ui/components/icons";

/**
 * TU Wien Header Implementation
 * Migrated from migrate/extensions/src/tuwien/src/plugins/header/HeaderPlugin.tsx
 *
 * Complete header with TU Wien branding, navigation, and mobile sidebar trigger
 */

// CSS styles for TU Wien header (migrated from HeaderPlugin.css)
const headerStyles = `
  .tuwien-main-navigation {
    height: 4rem;
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    text-transform: uppercase;
  }

  .tuwien-main-navigation a {
    display: flex;
    align-items: center;
    padding: 3px 1.25rem 0;
    border-bottom: 3px solid transparent;
    color: #767676;
    font-size: 18px;
    font-weight: 900;
    letter-spacing: 0.05em;
    text-decoration: none;
  }

  .tuwien-main-navigation .lecturetube {
    border-color: #069;
    color: #069;
  }

  .tuwien-main-navigation a.research:hover,
  .tuwien-main-navigation a.research:focus {
    color: #004b43;
  }

  .tuwien-main-navigation .lecturetube:hover,
  .tuwien-main-navigation .lecturetube:focus {
    border-color: #063e5a;
    color: #063e5a;
  }

  .tuwien-tu-home {
    padding: 0.875rem 1.25rem 0;
  }

  .tuwien-logos {
    display: flex;
    height: 4rem;
  }

  @media screen and (max-width: 767px) {
    .tuwien-desktop-only {
      display: none !important;
      visibility: hidden !important;
    }
  }
`;

const TUWienHeader: React.FC = () => {
  const { t, i18n } = useI18n();
  const { isMobile, toggleSidebar } = useSidebar();

  useEffect(() => {
    const loadTranslations = async () => {
      await loadNamespace("header", i18n.language);
    };
    loadTranslations();
  }, [i18n.language, t]);

  return (
    <>
      {/* Inject the CSS styles */}
      <style dangerouslySetInnerHTML={{ __html: headerStyles }} />

      <div className="flex w-full justify-between items-center">
        {/* Left: Mobile sidebar trigger */}
        <div>
          {isMobile && (
            <Button
              type="button"
              className="m-2.5 p-2.5 text-foreground xl:hidden"
              variant="outline"
              size="icon"
              onClick={() => {
                toggleSidebar();
              }}
            >
              <span className="sr-only">Open sidebar</span>
              <Menu className="w-5 h-5" aria-hidden="true" />
            </Button>
          )}
        </div>

        {/* Center: Empty space for flexibility */}
        <div></div>

        {/* Right: TU Wien Navigation and Logo */}
        <div className="inline-flex justify-end">
          {/* Main Navigation */}
          <nav
            id="main-navigation"
            className="tuwien-desktop-only tuwien-main-navigation"
            aria-label="Hauptmenü"
          >
            <a href="//video.tuwien.ac.at" className="research">
              <div className="icon icon--lecturetube"></div>
              Portal
            </a>
            <a href="/" className="lecturetube">
              Manage
            </a>
          </nav>

          {/* TU Wien Logo */}
          <div className="tuwien-logos">
            <a
              className="tuwien-tu-home"
              href="//tuwien.ac.at"
              rel="noopener noreferrer"
              target="_blank"
            >
              <svg
                className="w-20 h-20"
                role="img"
                aria-label="TU Wien - Hauptseite"
                version="1.1"
                id="tuw-logo"
                xmlns="http://www.w3.org/2000/svg"
                x="0px"
                y="0px"
                viewBox="0 0 97 97"
                xmlSpace="preserve"
              >
                <g>
                  <path
                    style={{ fill: "#006699" }}
                    d="M86.5,1c5.2,0,9.5,4.3,9.5,9.5l0,76c0,5.3-4.3,9.5-9.5,9.5h-76C5.3,96,1,91.7,1,86.5l0-76C1,5.3,5.3,1,10.5,1
                     H86.5z"
                  />
                  <path
                    style={{ fill: "#FFF" }}
                    d="M21.1,23.6h10.1v33.7H21.1V23.6z M8.3,10.5h35.5v10.1H8.3V10.5z M29.7,69.6h-3.4l-2.6,10.5l-3.1-10.5h-2.4
                     l-3.1,10.5l-2.6-10.5H9.2l4.5,16.7h2.7l3.1-10.1l3.1,10.1h2.7L29.7,69.6z M86.3,86.3V69.6h-3.3v10.2l-6.6-10.2h-2.9v16.7h3.3V76
                     l6.6,10.3H86.3z M63,86.3v-2.9h-7.7v-4.1h6.6v-2.9h-6.6v-3.9H63v-2.9h-11v16.7H63z M40.8,69.6h-3.3v16.7h3.3V69.6z M65.9,57.6
                     l-0.5,0c-9.5-1-16.9-9-16.9-18.8V10.5h10.3l0,28c0,4.1,2.8,7.8,6.7,8.7c0.2,0,0.3,0.1,0.5,0.1L65.9,57.6z M68.9,47.3
                     c0.2,0,0.3,0,0.4-0.1c3.8-1,6.7-4.6,6.7-8.7l-0.1-28h10.3v28.1c0,9.8-7.4,17.9-16.9,18.9l-0.4,0L68.9,47.3z"
                  />
                </g>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export { TUWienHeader };
