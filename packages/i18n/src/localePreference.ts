import { i18next } from "./index";

/**
 * Deployment default vs. user choice.
 *
 * `app.locale` in `config.json` is the language a deployment starts users in —
 * it is not a lock. Once someone picks a language from the switcher, that
 * choice wins on every later visit.
 *
 * The distinction needs its own storage key: i18next's browser detector caches
 * whatever language it *detected* on the first visit, so the presence of its
 * cache says nothing about whether a human ever chose. This key is written
 * only by {@link setUserLanguage}.
 */
const USER_CHOICE_KEY = "mui.locale.userChoice";

/** localStorage can throw (private mode, disabled storage) — never fatal here. */
const readUserChoice = (): string | null => {
  try {
    return window.localStorage.getItem(USER_CHOICE_KEY);
  } catch {
    return null;
  }
};

/**
 * Switch the UI language because the user asked for it, and remember that it
 * was their decision.
 */
export const setUserLanguage = async (language: string): Promise<void> => {
  await i18next.changeLanguage(language);
  // Keeps the in-session language stable against a re-detection, matching what
  // the switcher did before this helper existed.
  i18next.options.lng = language;
  try {
    window.localStorage.setItem(USER_CHOICE_KEY, language);
  } catch {
    // Storage unavailable: the choice holds for this session only.
  }
};

/** The language the user picked, or `null` if they never did. */
export const getUserLanguage = (): string | null => readUserChoice();

/**
 * Apply the configured default language.
 *
 * A no-op when the user has already chosen one, or when the deployment ships
 * no `app.locale`. Call it once, after the config has loaded.
 */
export const applyConfiguredLanguage = async (locale: string | undefined): Promise<void> => {
  if (!locale) return;
  if (readUserChoice()) return;
  if (i18next.resolvedLanguage === locale) return;

  await i18next.changeLanguage(locale);
};
