import React, { type FC, useEffect } from "react";

import { usePluginTranslation, createOrganizationNamespace, Trans } from "@workspace/i18n";
import { useGetCurrentUser } from "@workspace/query";
import { UploadCloud, Film } from "@workspace/ui/components";

/**
 * TU Wien Landing Page Implementation
 * Migrated from migrate/extensions/src/tuwien/src/plugins/home/InfoPage.tsx
 * University-specific welcome page with TU Wien LectureTube branding
 */
const InfoPage: FC = () => {
  const namespace = createOrganizationNamespace("tuwien", "landing-page");
  const { data } = useGetCurrentUser();

  const { t, i18n } = usePluginTranslation([namespace]);

  useEffect(() => {
    const loadTranslations = async () => {
      // The plugin system should handle translation loading automatically
      // but we'll keep this pattern for consistency with the original
    };
    loadTranslations();
  }, [i18n.language, t]);

  return (
    <div className="h-full home-links bg-[#f6f6f6]">
      <div className="relative h-full isolate">
        <img
          width="1440"
          height="533"
          alt="Innenansicht Hörsaal"
          src="https://cdn-llt-de7f6f9660259f2885536f478503e3ba8b00f9b724af2dafeac9fb1.git-pages.tuwien.ac.at/gallery/tuwien_AEU1-11-pano.jpg"
          className="w-full"
        />
        <div className="w-full">
          <div className="bg-white border-solid border-b-[1px] border-color-[#e6e6e6]">
            <div className="md:mx-0 md:container px-4 md:px-[90px] py-6">
              <h1 className="text-3xl font-bold text-[#069]">LectureTube</h1>
              <p className="text-lg">Enhancing Education Through Video</p>
            </div>
          </div>
          <div className="md:mx-0 md:container px-4 md:px-[90px] py-8">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold">{t(`${namespace}:ups`)}</h2>
              <p className="mt-4">{t(`${namespace}:ups_intro`)}</p>
            </section>
            <section className="mb-8">
              <h3 className="text-xl font-semibold">{t(`${namespace}:features_header`)}</h3>
              <ul className="list-disc list-inside mt-4">
                <Trans
                  i18nKey={`${namespace}:features`}
                  components={{ strong: <strong />, li: <li /> }}
                />
              </ul>
            </section>
            <section className="mb-8">
              <h3 className="text-xl font-semibold">{t(`${namespace}:cta_title`)}</h3>

              {data?.currentUser.userRole === "ROLE_USER_ANONYMOUS" ? (
                <a
                  href="/Shibboleth.sso/Login?target=/management-ui"
                  className="mt-2 inline-block bg-[#069] text-white px-6 py-2 rounded shadow"
                >
                  Login
                </a>
              ) : (
                <div className="grid gap-4 grid-cols-4 justify-start mb-8 mt-4">
                  <a
                    href="/management-ui/upload"
                    className="min-w-40 bg-white rounded-none transition duration-300 group border-solid border-b-[3px] border-color-[#e6e6e6]"
                  >
                    <div className="p-6">
                      <h4 className="text-base text-center md:text-lg font-semibold mb-2">
                        {t(`${namespace}:cta_upload`)}
                      </h4>
                      <UploadCloud className="mx-auto w-12 h-12 text-[#646363] transform group-hover:scale-125 transition-transform" />
                    </div>
                  </a>
                  <a
                    href="//studio.tuwien.ac.at?return.label=LectureTube&return.target=https://admin.lecturetube.tuwien.ac.at/management-ui"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-40 bg-white rounded-none transition duration-300 group border-solid border-b-[3px] border-color-[#e6e6e6]"
                  >
                    <div className="p-6">
                      <h4 className="text-base text-center md:text-lg font-semibold mb-2">
                        {t(`${namespace}:cta_studio`)}
                      </h4>
                      <Film className="mx-auto w-12 h-12 text-[#646363] transform group-hover:scale-125 transition-transform" />
                    </div>
                  </a>
                </div>
              )}
            </section>
            <section className="mb-8">
              <h3 className="text-xl font-semibold">Knowledge Base</h3>
              <div className="mt-4 p-6 bg-white rounded-none shadow">
                <h4 className="text-lg font-semibold">{t(`${namespace}:kb_subtitle`)}</h4>
                <p className="mt-2">
                  <Trans
                    i18nKey={`${namespace}:kb_info`}
                    t={t}
                    components={{
                      kb_link: (
                        <a
                          href={t(`${namespace}:kb_link`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#069] underline"
                        />
                      ),
                    }}
                  />
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export { InfoPage };
