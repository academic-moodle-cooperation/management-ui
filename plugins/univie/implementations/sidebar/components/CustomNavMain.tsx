import React from "react";

import { usePluginTranslation, createOrganizationNamespace } from "@workspace/i18n";
import { NavMain, type NavMainProps } from "@workspace/ui/components";
import { cn } from "@workspace/ui/lib/utils";

export const CustomNavMain = (props: NavMainProps) => {
  const namespace = createOrganizationNamespace("univie", "sidebar");
  const { t } = usePluginTranslation([namespace]);

  // Translate titles that are i18n keys (starting with namespace prefix)
  const translatedItems = React.useMemo(() => {
    return (
      props.items?.map((item) => {
        // Check if title is an i18n key (format: "namespace:key")
        if (item.title.includes(":")) {
          const translatedTitle = t(item.title) || item.title;
          return { ...item, title: translatedTitle };
        }
        return item;
      }) || []
    );
  }, [props.items, t]);

  return (
    <NavMain
      groupClassName={cn(props.open && "p-0")}
      menuClassName={cn("flex flex-col gap-1", props.open && "gap-0")}
      customItemStyles={cn("h-12 flex gap-4 px-6", props.open && "rounded-none")}
      renderActiveIndicator={(isActive, open) =>
        isActive && open && <div className="absolute inset-y-0 left-0 w-2 bg-primary " />
      }
      customActiveStyles={"data-[active=true]:bg-sidebar-primary"}
      {...props}
      items={translatedItems}
    />
  );
};
