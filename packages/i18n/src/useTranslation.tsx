import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpBackend from "i18next-http-backend";
import React from "react";
import { useTranslation, initReactI18next, Trans as i18nTrans } from "react-i18next";

export const selectedLanguage = {
  de: "Deutsch",
  en: "English",
};

i18n
  .use(HttpBackend) // Enables loading translations via HTTP
  .use(initReactI18next) // passes i18n down to react-i18next
  .use(LanguageDetector)
  .init({
    partialBundledLanguages: true,
    fallbackLng: "en",
    ns: ["common", "series", "episodes", "upload"], // Split namespaces for better organization
    defaultNS: "common",
    backend: {
      loadPath: import.meta.env.DEV
        ? "/management-ui/dist/locales/{{ns}}/{{lng}}.json"
        : "/management-ui/locales/{{ns}}/{{lng}}.json", // Path to translation files
    },
    debug: false,
    react: {
      useSuspense: true,
    },
    interpolation: {
      escapeValue: false, // react already safes from xss => https://www.i18next.com/translation-function/interpolation#unescape
    },
  });

export * from "./translationLoader";
export { i18n as i18nConfig };
export const useI18n = useTranslation;
export const Trans = i18nTrans;
export const LinkText = (props: { to: string; title: string; children?: React.ReactNode }) => {
  return (
    <a
      href={props.to || "#"}
      target="_blank"
      rel="noreferrer"
      title={props.title || ""}
      className="text-indigo-600 hover:text-indigo-500"
    >
      {props.children}
    </a>
  );
};
