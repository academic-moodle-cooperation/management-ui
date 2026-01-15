import React, { type FC } from "react";

import { createOrganizationNamespace, usePluginTranslation } from "@workspace/i18n";
import { useGetCurrentUser } from "@workspace/query";
import { useAuthActions } from "@workspace/router";
import { Button } from "@workspace/ui/components";

// Import the SVG as a URL
import univieLogoUrl from "./assets/univie_logo.svg?url";

/**
 * University of Vienna Landing Page Implementation
 * Migrated from migrate/extensions/src/univie/src/plugins/home/InfoPage.tsx
 * University-specific welcome page with Univie u:stream branding
 */
const InfoPage: FC = () => {
  const { data } = useGetCurrentUser();
  const { login } = useAuthActions();
  const namespace = createOrganizationNamespace("univie", "landing-page");

  const { t } = usePluginTranslation([namespace]);

  return (
    <div className="h-full w-full bg-white">
      <div className="relative h-full px-6 isolate sm:py-40 lg:px-8">
        {/* University of Vienna logo background */}
        <div
          className="absolute inset-0 object-cover w-full z-100 bg-no-repeat h-full bg-[right_-12rem_bottom_-12rem] opacity-50 pointer-events-none"
          style={{
            backgroundImage: `url(${univieLogoUrl})`,
          }}
        />

        <div className="absolute inset-0 bg-white [mask-image:radial-gradient(150%_250%_at_top_left,white,transparent)] pointer-events-none" />

        <div
          className="absolute inset-x-0 flex justify-center overflow-hidden top-10 -z-10 transform-gpu blur-3xl"
          aria-hidden="true"
        >
          <div
            className="aspect-[1108/632] w-[69.25rem] flex-none bg-gradient-to-r from-[#80caff] to-[#4f46e5] opacity-10"
            style={{
              clipPath:
                "polygon(73.6% 51.7%, 91.7% 11.8%, 100% 46.4%, 97.4% 82.2%, 92.5% 84.9%, 75.7% 64%, 55.3% 47.5%, 46.5% 49.4%, 45% 62.9%, 50.3% 87.2%, 21.3% 64.1%, 0.1% 100%, 5.4% 51.1%, 21.4% 63.9%, 58.9% 0.2%, 73.6% 51.7%)",
            }}
          />
        </div>
        <div className="relative z-10 flex flex-col max-w-3xl mx-auto text-center gap-y-6">
          <h1 className="inline mt-10 text-4xl font-bold tracking-tight text-sky-700 sm:text-6xl font-display">
            {t(`${namespace}:heading1`)} {t(`${namespace}:heading2`)}
          </h1>

          <p className="mt-6 text-lg leading-8 text-black">{t(`${namespace}:text`)}</p>
          <div className="flex items-center justify-center mt-10 gap-x-6">
            {data?.currentUser.username === "anonymous" && (
              <Button
                type="button"
                onClick={() => login()}
                className="bg-sky-700 hover:bg-sky-600 text-white"
              >
                Login
              </Button>
            )}

            <div className="hidden sm:flex sm:justify-center">
              <div className="relative px-3 py-1 text-sm leading-6 text-black rounded-full ring-1 ring-black/20 hover:ring-black/40">
                <a
                  href="https://zid.univie.ac.at/ustream/"
                  className=""
                  target="_blank"
                  rel="noreferrer"
                >
                  {t(`${namespace}:infoLink`)}{" "}
                  <span className="absolute inset-0" aria-hidden="true" />
                  <span className="font-semibold text-black">
                    u:stream <span aria-hidden="true">&rarr;</span>
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { InfoPage };
