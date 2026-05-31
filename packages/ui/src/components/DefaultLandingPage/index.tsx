import { useTranslation } from "@oc-mui/i18n";

import { Icons, ArrowRight, LogIn } from "../icons";
import { Badge, Button } from "../ui";

import type { FC } from "react";

const DefaultLandingPage: FC = () => {
  const { t } = useTranslation();
  return (
    <>
      <div className="absolute z-20 top-16 inset-x-0 flex justify-center overflow-hidden pointer-events-none">
        <div className="w-[108rem] flex-none flex justify-end">
          <picture>
            <source srcSet="./docs@30.8b9a76a2.avif" type="image/avif" />
            <img
              src="./docs@tinypng.d9e4dcdc.png"
              alt=""
              className="w-[71.75rem] flex-none max-w-none dark:hidden"
              decoding="async"
            />
          </picture>
          <picture>
            <source srcSet="./docs-dark@30.1a9f8cbf.avif" type="image/avif" />
            <img
              src="./docs-dark@tinypng.1bbe175e.png"
              alt=""
              className="w-[90rem] flex-none max-w-none hidden dark:block"
              decoding="async"
            />
          </picture>
        </div>
      </div>
      <section className="container w-full antialiased">
        <div className="grid place-items-center lg:max-w-screen-xl gap-8 mx-auto py-20 md:py-32">
          <div className="text-center space-y-8">
            <Badge variant="outline" className="text-sm py-2">
              <span className="mr-2 text-primary">
                <Badge>{t("landing.update")}</Badge>
              </span>
              <span> {t("landing.newVersion")} </span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Badge>

            <div className="max-w-screen-lg mx-auto text-center text-3xl md:text-5xl font-bold">
              <h1 className="text-3xl font-semibold -tracking-4 md:text-5xl mb-6 md:mb-4">
                {t("landing.welcome")}
              </h1>
              {/* <h1>
                Welcome to the
              </h1> */}
              <h1>
                <span className="text-transparent text-6xl md:text-8xl px-2 bg-gradient-to-r from-[#D247BF] to-primary bg-clip-text mt-2">
                  Management UI
                </span>
              </h1>
              <h2 className="text-2xl md:text-3xl font-normal text-muted-foreground mt-10">
                {t("landing.tagline")}
              </h2>
            </div>

            <p className="max-w-screen-md mx-auto text-xl text-muted-foreground mt-10">
              {t("landing.description")}
            </p>

            <div className="space-y-4 md:space-y-0 md:space-x-4 mt-10">
              <Button className="w-5/6  md:w-1/4 font-bold group/arrow">
                <LogIn className="size-5" />
                {t("auth.signIn")}
                {/* <ArrowRight className="size-5 ml-2 group-hover/arrow:translate-x-1 transition-transform" /> */}
              </Button>

              <Button variant="secondary" className="w-5/6 md:w-1/4 font-bold group/arrow">
                <Icons.gitHub className="size-5 mr-2" />
                Github
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export { DefaultLandingPage };
