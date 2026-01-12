import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components";
import { i18next, selectedLanguage } from "@workspace/i18n";

export const LangSwitcher = () => {
  const getLanguage = ({ language }: { language: "en" | "de" | undefined }) => {
    if (language && selectedLanguage[language]) {
      return selectedLanguage[language];
    } else {
      return language;
    }
  };

  const [language, setLanguage] = useState<"en" | "de" | undefined>(
    (i18next.resolvedLanguage as "en" | "de") || "en"
  );

  return (
    <div className="flex items-center">
      <DropdownMenu>
        <DropdownMenuTrigger>{getLanguage({ language })}</DropdownMenuTrigger>

        <DropdownMenuContent>
          <DropdownMenuItem
            onClick={() =>
              i18next
                .changeLanguage("de")
                .then(() => (i18next.options.lng = "de"))
                .then(() => setLanguage("de"))
            }
          >
            Deutsch
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              i18next
                .changeLanguage("en")
                .then(() => (i18next.options.lng = "en"))
                .then(() => setLanguage("en"))
            }
          >
            English
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
