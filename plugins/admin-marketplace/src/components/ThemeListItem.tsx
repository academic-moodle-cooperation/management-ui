import { Check, Loader2, Palette } from "lucide-react";
import React from "react";

import { Badge } from "@opencast-mui/ui/components";

import type { ThemeDefinition } from "../services/themes";

export interface ThemeListItemProps {
  theme: ThemeDefinition;
  isInstalled: boolean;
  isLoading: boolean;
  onClick: () => void;
}

export const ThemeListItem: React.FC<ThemeListItemProps> = ({
  theme,
  isInstalled,
  isLoading,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className="flex w-full cursor-pointer items-center gap-3 border-b px-3 py-3 text-left transition-colors hover:bg-muted/50"
  >
    <div
      className={`flex shrink-0 rounded-md p-2 ${
        isInstalled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
      }`}
    >
      <Palette className="h-4 w-4" />
    </div>

    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">{theme.name}</span>
        <Badge variant="outline" className="h-4 px-1.5 py-0 text-[10px] font-normal">
          {theme.category}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">by {theme.author}</p>
    </div>

    <div className="flex shrink-0 items-center justify-end">
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden />
      ) : isInstalled ? (
        <Badge className="border-0 bg-emerald-600 text-white">
          <Check className="mr-1 h-3 w-3" />
          Active
        </Badge>
      ) : null}
    </div>
  </button>
);
