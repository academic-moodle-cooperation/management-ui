import { selectedLanguage, setUserLanguage, useI18n } from "@oc-mui/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@oc-mui/ui/components";

export const LangSwitcher = () => {
  const getLanguage = ({ language }: { language: "en" | "de" | undefined }) => {
    if (language && selectedLanguage[language]) {
      return selectedLanguage[language];
    } else {
      return language;
    }
  };

  // Read the language from i18next instead of holding it in local state: the
  // deployment's `app.locale` is applied once the config has loaded, which is
  // after this component first renders — a `useState` snapshot would keep
  // showing the detected language while the UI already speaks the configured
  // one.
  const { i18n } = useI18n();
  const language = (i18n.resolvedLanguage as "en" | "de" | undefined) || "en";

  return (
    <div className="flex items-center">
      <DropdownMenu>
        <DropdownMenuTrigger>{getLanguage({ language })}</DropdownMenuTrigger>

        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => void setUserLanguage("de")}>Deutsch</DropdownMenuItem>
          <DropdownMenuItem onClick={() => void setUserLanguage("en")}>English</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
