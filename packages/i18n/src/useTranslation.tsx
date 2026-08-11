import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpBackend from "i18next-http-backend";
import React from "react";
import { useTranslation, initReactI18next, Trans as i18nTrans } from "react-i18next";

export const selectedLanguage = {
  de: "Deutsch",
  en: "English",
};

// Core locales are emitted to `<shellBase>/locales` in both dev (served by
// vite-plugin-static-copy) and prod (build output). The dev server does NOT
// expose them under a `/dist/` prefix, so both modes use the same base.
const defaultLocalesBase = "/management-ui/locales";
const pluginNamespaceBases = new Map<string, string>();

const buildLocaleUrl = (namespace: string, language: string) => {
  const base = pluginNamespaceBases.get(namespace) ?? defaultLocalesBase;
  return `${base.replace(/\/$/, "")}/${namespace}/${language}.json`;
};

export const registerPluginI18nNamespaces = (namespaces: string[], localesUrl: string) => {
  if (!localesUrl || !Array.isArray(namespaces)) return;
  const base = localesUrl.replace(/\/$/, "");
  namespaces.forEach((ns) => {
    if (!ns) return;
    pluginNamespaceBases.set(ns, base);
  });
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
      loadPath: (lngs: string | string[], namespaces: string | string[]) => {
        const languages = Array.isArray(lngs) ? lngs : [lngs];
        const nsList = Array.isArray(namespaces) ? namespaces : [namespaces];
        const urls = nsList.flatMap((ns) => languages.map((lng) => buildLocaleUrl(ns, lng)));
        return urls.length === 1 ? urls[0] : urls;
      }, // Dynamic path to translation files (core + JAR plugin locales)
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
      className="text-primary hover:text-primary/80"
    >
      {props.children}
    </a>
  );
};
