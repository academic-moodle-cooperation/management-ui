import { Toaster } from "@oc-mui/ui/components";

import { BadgeSection, ButtonSection } from "./sections/actions";
import { DataTableSection } from "./sections/composite";
import {
  AccordionSection,
  AvatarSection,
  CardSection,
  CollapsibleSection,
  ScrollAreaSection,
  SeparatorSection,
  SkeletonSection,
  TableSection,
} from "./sections/data-display";
import {
  CalendarSection,
  CheckboxSection,
  InputSection,
  LabelSection,
  SelectSection,
  SwitchSection,
  TextareaSection,
} from "./sections/forms";
import { BreadcrumbSection, SidebarSection, TabsSection } from "./sections/navigation";
import {
  AlertDialogSection,
  CommandSection,
  DialogSection,
  DrawerSection,
  DropdownMenuSection,
  HoverCardSection,
  PopoverSection,
  SheetSection,
  SonnerSection,
  TooltipSection,
} from "./sections/overlays";
import { PrecedenceSection } from "./sections/precedence";
import { useGallerySettings } from "./settings";
import { useTheme } from "./themes";
import { Toolbar } from "./Toolbar";

import type { ReactNode } from "react";

/**
 * One entry per file in `packages/ui/src/components/ui/`, keyed by the file
 * name, followed by the composite components. Add the section here when a
 * base component is added there.
 */
const SECTIONS: { id: string; render: (open: boolean) => ReactNode }[] = [
  { id: "button", render: () => <ButtonSection /> },
  { id: "badge", render: () => <BadgeSection /> },
  { id: "input", render: () => <InputSection /> },
  { id: "textarea", render: () => <TextareaSection /> },
  { id: "label", render: () => <LabelSection /> },
  { id: "checkbox", render: () => <CheckboxSection /> },
  { id: "switch", render: () => <SwitchSection /> },
  { id: "select", render: (open) => <SelectSection open={open} /> },
  { id: "calendar", render: () => <CalendarSection /> },
  { id: "card", render: () => <CardSection /> },
  { id: "table", render: () => <TableSection /> },
  { id: "tabs", render: () => <TabsSection /> },
  { id: "breadcrumb", render: () => <BreadcrumbSection /> },
  { id: "accordion", render: () => <AccordionSection /> },
  { id: "collapsible", render: () => <CollapsibleSection /> },
  { id: "avatar", render: () => <AvatarSection /> },
  { id: "skeleton", render: () => <SkeletonSection /> },
  { id: "separator", render: () => <SeparatorSection /> },
  { id: "scroll-area", render: () => <ScrollAreaSection /> },
  { id: "dialog", render: (open) => <DialogSection open={open} /> },
  { id: "alert-dialog", render: (open) => <AlertDialogSection open={open} /> },
  { id: "sheet", render: (open) => <SheetSection open={open} /> },
  { id: "drawer", render: (open) => <DrawerSection open={open} /> },
  { id: "dropdown-menu", render: (open) => <DropdownMenuSection open={open} /> },
  { id: "popover", render: (open) => <PopoverSection open={open} /> },
  { id: "hover-card", render: (open) => <HoverCardSection open={open} /> },
  { id: "tooltip", render: (open) => <TooltipSection open={open} /> },
  { id: "command", render: () => <CommandSection /> },
  { id: "sonner", render: () => <SonnerSection /> },
  { id: "sidebar", render: () => <SidebarSection /> },
  { id: "data-table", render: () => <DataTableSection /> },
  { id: "precedence", render: () => <PrecedenceSection /> },
];

export function Gallery() {
  const [settings, update] = useGallerySettings();
  useTheme(settings.theme);

  const sections = settings.only
    ? SECTIONS.filter((section) => section.id === settings.only)
    : SECTIONS;

  return (
    <div className="bg-background text-foreground min-h-svh">
      {settings.chrome ? <Toolbar settings={settings} update={update} /> : null}
      <div className="mx-auto flex max-w-7xl gap-8 px-6">
        {settings.chrome && !settings.only ? (
          <nav className="sticky top-16 hidden h-[calc(100svh-4rem)] w-40 shrink-0 overflow-y-auto py-8 text-sm lg:block">
            <ul className="flex flex-col gap-1">
              {SECTIONS.map((section) => (
                <li key={section.id}>
                  <a
                    className="text-muted-foreground hover:text-foreground"
                    href={`#${section.id}`}
                  >
                    {section.id}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
        <div className="min-w-0 flex-1 pb-24">
          {sections.map((section) => (
            <div key={section.id}>{section.render(settings.open === section.id)}</div>
          ))}
        </div>
      </div>
      <Toaster />
    </div>
  );
}
