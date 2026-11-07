import { usePluginTranslation } from "@oc-mui/i18n";
import { Badge, Tooltip, TooltipContent, TooltipTrigger } from "@oc-mui/ui/components";

import type { UsageSource } from "../data/types";

/** Tells the user where the numbers come from — demo data is never silent. */
export const SourceBadge = ({ source }: { source: UsageSource | undefined }) => {
  const { t } = usePluginTranslation(["usage-stats"]);
  if (!source) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant={source === "demo" ? "outline" : "secondary"}>
          {t(`usage-stats:source.${source}`)}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>{t(`usage-stats:source.${source}Hint`)}</TooltipContent>
    </Tooltip>
  );
};
