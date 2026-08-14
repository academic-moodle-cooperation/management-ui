import i18next from "i18next";
import { I18nextProvider, useTranslation } from "react-i18next";

// Public i18n API. This is the stable facade; plugin authors and apps must
// import translation primitives from here, never from i18next / react-i18next
// directly. Swapping the i18n implementation later stays a contained change
// inside this package. See packages/i18n/README.md ("Stability contract").
export * from "./useTranslation";
export * from "./translationLoader";
export * from "./dateFormat";
export * from "./localePreference";
export { i18next, I18nextProvider, useTranslation };
