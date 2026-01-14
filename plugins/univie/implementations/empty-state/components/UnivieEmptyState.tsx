import React from "react";

import { LinkText, Trans, usePluginTranslation } from "@workspace/i18n";

const UnivieEmptyState: React.FC = () => {
  const { t } = usePluginTranslation(["univie-empty-state"]);
  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="text-center my-16 flex flex-col items-center">
        <svg
          className="w-12 h-12 mx-auto text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
          />
        </svg>
        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
          {t("series.noSeriesAvailable.title")}
        </h4>

        <p className="mt-1 text-sm text-muted-foreground max-w-md">
          <Trans
            i18nKey="series.noSeriesAvailable.text"
            components={{
              link1en: (
                <LinkText
                  key="link1en"
                  to={"https://capture.ustream.univie.ac.at/capture-ui/info"}
                  title="u:stream administration"
                />
              ),
              link1de: (
                <LinkText
                  key="link1de"
                  to={"https://capture.ustream.univie.ac.at/capture-ui/info"}
                  title="u:stream-Administration"
                />
              ),
              link2en: (
                <LinkText
                  key="link2en"
                  to={
                    "https://zid.univie.ac.at/en/ustream/user-guides/registration-and-administration/"
                  }
                  title="Registration and administration guide"
                />
              ),
              link2de: (
                <LinkText
                  key="link2de"
                  to={
                    "https://zid.univie.ac.at/ustream/anleitungen-und-faq/anmeldung-und-verwaltung/"
                  }
                  title="Anleitung Anmeldung und Verwaltung"
                />
              ),
            }}
          />
        </p>
      </div>
    </div>
  );
};

export { UnivieEmptyState };
