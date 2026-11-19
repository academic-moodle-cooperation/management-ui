/* eslint-disable react/display-name -- the helpers below build table rows of a fixture, they are not components */
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  Avatar,
  AvatarFallback,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Command,
  CommandItem,
  CommandList,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  Skeleton,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsList,
  TabsTrigger,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@oc-mui/ui/components";

import type { Case, Mark } from "./component-variables";
import type { CSSProperties, ReactNode } from "react";

/**
 * The cases for the components beyond button, input and checkbox: at least
 * one variable per component, and every mechanism that is not a plain typed
 * utility (size and line height in one class, a breakpoint, an arbitrary
 * property, a margin, an inline width).
 */

type Render = (className: string | undefined, mark: Mark) => ReactNode;

const table =
  (part: "head" | "cell" | "row"): Render =>
  (className, mark) => (
    <Table className="w-60">
      <TableHeader>
        <TableRow>
          <TableHead {...(part === "head" ? { ...mark, className } : {})}>Head</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow {...(part === "row" ? { ...mark, className } : {})}>
          <TableCell {...(part === "cell" ? { ...mark, className } : {})}>Cell</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );

const tabs =
  (part: "list" | "trigger"): Render =>
  (className, mark) => (
    <Tabs defaultValue="a">
      <TabsList {...(part === "list" ? { ...mark, className } : {})}>
        <TabsTrigger value="a" {...(part === "trigger" ? { ...mark, className } : {})}>
          One
        </TabsTrigger>
        <TabsTrigger value="b">Two</TabsTrigger>
      </TabsList>
    </Tabs>
  );

const card =
  (part: "card" | "title" | "description" | "content"): Render =>
  (className, mark) => (
    <Card
      className={`w-56 ${part === "card" ? (className ?? "") : ""}`}
      {...(part === "card" ? mark : {})}
    >
      <CardHeader>
        <CardTitle {...(part === "title" ? { ...mark, className } : {})}>Title</CardTitle>
        <CardDescription {...(part === "description" ? { ...mark, className } : {})}>
          Description
        </CardDescription>
      </CardHeader>
      <CardContent {...(part === "content" ? { ...mark, className } : {})}>Content</CardContent>
    </Card>
  );

const breadcrumb =
  (part: "nav" | "list" | "link"): Render =>
  (className, mark) => (
    <Breadcrumb {...(part === "nav" ? { ...mark, className } : {})}>
      <BreadcrumbList {...(part === "list" ? { ...mark, className } : {})}>
        <BreadcrumbItem>
          <BreadcrumbLink href="#" {...(part === "link" ? { ...mark, className } : {})}>
            Home
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>Here</BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );

const sidebarButton =
  (props: React.ComponentProps<typeof SidebarMenuButton> = {}): Render =>
  (className, mark) => (
    <SidebarProvider className="min-h-0 w-auto">
      <Sidebar collapsible="none">
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton {...props} {...mark} className={className}>
                Entry
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  );

/** Here the caller's lever is the documented inline variable, not a class. */
const sidebarWidth: Render = (caller, mark) => (
  <SidebarProvider
    className="min-h-0 w-auto"
    style={caller ? ({ "--sidebar-width": "10rem" } as CSSProperties) : undefined}
  >
    <Sidebar collapsible="none" {...mark}>
      <SidebarContent>Width</SidebarContent>
    </Sidebar>
  </SidebarProvider>
);

const overlayText = (
  <>
    <span>Text</span>
  </>
);

export const ROLLOUT_CASES: Case[] = [
  // ---- form parts ----
  {
    variable: "--label-font-weight",
    prop: "fontWeight",
    render: (c) => <Label className={c}>Label</Label>,
    caller: "font-bold",
  },
  {
    variable: "--label-line-height",
    prop: "lineHeight",
    render: (c) => <Label className={c}>Label</Label>,
    caller: "leading-loose",
  },
  {
    variable: "--label-font-size",
    prop: "fontSize",
    render: (c) => <Label className={c}>Label</Label>,
    caller: "text-lg",
  },
  {
    variable: "--textarea-radius",
    prop: "borderTopLeftRadius",
    render: (c) => <Textarea className={`w-40 ${c ?? ""}`} />,
    caller: "rounded-none",
  },
  {
    variable: "--textarea-min-height",
    prop: "minHeight",
    render: (c) => <Textarea className={`w-40 ${c ?? ""}`} />,
    caller: "min-h-40",
  },
  {
    variable: "--textarea-font-size",
    prop: "fontSize",
    render: (c) => <Textarea className={`w-40 ${c ?? ""}`} />,
    caller: "md:text-lg",
  },
  {
    variable: "--textarea-line-height",
    prop: "lineHeight",
    render: (c) => <Textarea className={`w-40 ${c ?? ""}`} />,
    caller: "md:text-lg",
  },
  {
    variable: "--textarea-ring-color-focus",
    prop: "boxShadow",
    state: "focus",
    render: (c) => <Textarea className={`w-40 ${c ?? ""}`} />,
    caller: "focus-visible:ring-warning",
  },
  {
    variable: "--switch-width",
    prop: "width",
    render: (c) => <Switch className={c} />,
    caller: "w-12",
  },
  {
    variable: "--switch-height",
    prop: "height",
    render: (c) => <Switch className={c} />,
    caller: "h-8",
  },
  {
    variable: "--switch-bg-checked",
    prop: "backgroundColor",
    render: (c) => <Switch defaultChecked className={c} />,
    caller: "data-[state=checked]:bg-warning",
  },
  {
    variable: "--switch-bg-unchecked",
    prop: "backgroundColor",
    render: (c) => <Switch className={c} />,
    caller: "data-[state=unchecked]:bg-warning",
  },
  {
    variable: "--switch-thumb-size",
    prop: "width",
    target: "[data-slot=switch-thumb]",
    plainOnly: true,
    render: () => <Switch />,
    caller: "",
  },
  {
    variable: "--switch-thumb-shadow",
    prop: "boxShadow",
    target: "[data-slot=switch-thumb]",
    plainOnly: true,
    render: () => <Switch />,
    caller: "",
  },
  {
    variable: "--switch-thumb-ring-width",
    prop: "boxShadow",
    target: "[data-slot=switch-thumb]",
    plainOnly: true,
    render: () => <Switch />,
    caller: "",
  },
  {
    variable: "--select-trigger-height",
    prop: "height",
    render: (c) => (
      <Select>
        <SelectTrigger className={c}>
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
      </Select>
    ),
    caller: "data-[size=default]:h-12",
  },
  {
    variable: "--select-trigger-radius",
    prop: "borderTopLeftRadius",
    render: (c) => (
      <Select>
        <SelectTrigger className={c}>
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
      </Select>
    ),
    caller: "rounded-none",
  },
  {
    variable: "--select-trigger-font-size",
    prop: "fontSize",
    render: (c) => (
      <Select>
        <SelectTrigger className={c}>
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
      </Select>
    ),
    caller: "text-lg",
  },

  {
    variable: "--switch-thumb-offset-checked",
    prop: "translate",
    target: "[data-slot=switch-thumb]",
    plainOnly: true,
    render: () => <Switch defaultChecked />,
    caller: "",
  },
  {
    variable: "--button-text-decoration-link-hover",
    prop: "textDecorationLine",
    state: "hover",
    render: (c) => (
      <Button variant="link" className={c}>
        Link
      </Button>
    ),
    caller: "hover:no-underline",
  },

  // ---- display parts ----
  {
    variable: "--badge-radius",
    prop: "borderTopLeftRadius",
    render: (c) => <Badge className={c}>Badge</Badge>,
    caller: "rounded-none",
  },
  {
    variable: "--badge-bg-default",
    prop: "backgroundColor",
    render: (c) => <Badge className={c}>Badge</Badge>,
    caller: "bg-warning",
  },
  {
    variable: "--badge-font-size",
    prop: "fontSize",
    render: (c) => <Badge className={c}>Badge</Badge>,
    caller: "text-lg",
  },
  {
    variable: "--badge-line-height",
    prop: "lineHeight",
    render: (c) => <Badge className={c}>Badge</Badge>,
    caller: "text-lg",
  },
  {
    variable: "--badge-color-outline",
    prop: "color",
    render: (c) => (
      <Badge variant="outline" className={c}>
        Badge
      </Badge>
    ),
    caller: "text-warning",
  },
  {
    variable: "--badge-bg-default-hover",
    prop: "backgroundColor",
    state: "hover",
    render: (c) => (
      <Badge asChild className={c}>
        <a href="#component-variables">Badge</a>
      </Badge>
    ),
    caller: "[a&]:hover:bg-warning",
  },
  {
    variable: "--avatar-size",
    prop: "width",
    render: (c) => (
      <Avatar className={c}>
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
    ),
    caller: "size-12",
  },
  {
    variable: "--avatar-fallback-bg",
    prop: "backgroundColor",
    byId: true,
    render: (c, mark) => (
      <Avatar>
        <AvatarFallback {...mark} className={c}>
          AB
        </AvatarFallback>
      </Avatar>
    ),
    caller: "bg-warning",
  },
  {
    variable: "--skeleton-radius",
    prop: "borderTopLeftRadius",
    render: (c) => <Skeleton className={`h-4 w-24 ${c ?? ""}`} />,
    caller: "rounded-none",
  },
  {
    variable: "--separator-bg",
    prop: "backgroundColor",
    render: (c) => <Separator className={`w-24 ${c ?? ""}`} />,
    caller: "bg-warning",
  },
  {
    variable: "--separator-margin-y",
    prop: "marginTop",
    render: (c) => <Separator className={`w-24 ${c ?? ""}`} />,
    caller: "my-4",
  },
  {
    variable: "--separator-margin-x",
    prop: "marginLeft",
    render: (c) => <Separator className={`w-24 ${c ?? ""}`} />,
    caller: "mx-4",
  },
  { variable: "--card-gap", prop: "rowGap", render: card("card"), caller: "gap-2" },
  { variable: "--card-padding-y", prop: "paddingTop", render: card("card"), caller: "py-2" },
  { variable: "--card-spacing", prop: "paddingTop", render: card("card"), caller: "py-2" },
  { variable: "--card-bg", prop: "backgroundColor", render: card("card"), caller: "bg-warning" },
  {
    variable: "--card-title-font-weight",
    prop: "fontWeight",
    byId: true,
    render: card("title"),
    caller: "font-bold",
  },
  {
    variable: "--card-description-font-size",
    prop: "fontSize",
    byId: true,
    render: card("description"),
    caller: "text-lg",
  },
  {
    variable: "--card-content-padding-x",
    prop: "paddingLeft",
    byId: true,
    render: card("content"),
    caller: "px-2",
  },
  {
    variable: "--table-head-height",
    prop: "height",
    byId: true,
    render: table("head"),
    caller: "h-12",
  },
  {
    variable: "--table-cell-padding",
    prop: "paddingTop",
    byId: true,
    render: table("cell"),
    caller: "p-4",
  },
  {
    variable: "--table-row-bg-hover",
    prop: "backgroundColor",
    state: "hover",
    byId: true,
    render: table("row"),
    caller: "hover:bg-warning",
  },
  {
    variable: "--tabs-list-height",
    prop: "height",
    byId: true,
    render: tabs("list"),
    caller: "h-12",
  },
  {
    variable: "--tabs-list-bg",
    prop: "backgroundColor",
    byId: true,
    render: tabs("list"),
    caller: "bg-warning",
  },
  {
    variable: "--tabs-trigger-font-size",
    prop: "fontSize",
    byId: true,
    render: tabs("trigger"),
    caller: "text-lg",
  },
  {
    variable: "--tabs-trigger-bg-active",
    prop: "backgroundColor",
    byId: true,
    render: tabs("trigger"),
    caller: "data-[state=active]:bg-warning",
  },
  {
    variable: "--accordion-trigger-font-size",
    prop: "fontSize",
    byId: true,
    render: (c, mark) => (
      <Accordion type="single" collapsible className="w-40">
        <AccordionItem value="a">
          <AccordionTrigger {...mark} className={c}>
            Open
          </AccordionTrigger>
          <AccordionContent>Text</AccordionContent>
        </AccordionItem>
      </Accordion>
    ),
    caller: "text-lg",
  },
  {
    variable: "--accordion-trigger-padding-y",
    prop: "paddingTop",
    byId: true,
    render: (c, mark) => (
      <Accordion type="single" collapsible className="w-40">
        <AccordionItem value="a">
          <AccordionTrigger {...mark} className={c}>
            Open
          </AccordionTrigger>
          <AccordionContent>Text</AccordionContent>
        </AccordionItem>
      </Accordion>
    ),
    caller: "py-1",
  },
  {
    variable: "--scroll-area-thumb-bg",
    prop: "backgroundColor",
    target: "[data-slot=scroll-area-thumb]",
    plainOnly: true,
    render: () => (
      <ScrollArea type="always" className="h-10 w-24">
        <div className="h-40">Text</div>
      </ScrollArea>
    ),
    caller: "",
  },
  {
    variable: "--command-item-font-size",
    prop: "fontSize",
    byId: true,
    render: (c, mark) => (
      <Command className="w-40">
        <CommandList>
          <CommandItem {...mark} className={c}>
            Item
          </CommandItem>
        </CommandList>
      </Command>
    ),
    caller: "text-lg",
  },
  {
    variable: "--command-bg",
    prop: "backgroundColor",
    render: (c) => (
      <Command className={`w-40 ${c ?? ""}`}>
        <CommandList>
          <CommandItem>Item</CommandItem>
        </CommandList>
      </Command>
    ),
    caller: "bg-warning",
  },

  // ---- navigation ----
  {
    variable: "--breadcrumb-list-gap",
    prop: "columnGap",
    byId: true,
    render: breadcrumb("list"),
    caller: "sm:gap-4",
  },
  {
    variable: "--breadcrumb-list-font-size",
    prop: "fontSize",
    byId: true,
    render: breadcrumb("list"),
    caller: "text-lg",
  },
  {
    variable: "--breadcrumb-list-color",
    prop: "color",
    byId: true,
    render: breadcrumb("list"),
    caller: "text-warning",
  },
  {
    variable: "--breadcrumb-link-color-hover",
    prop: "color",
    state: "hover",
    byId: true,
    render: breadcrumb("link"),
    caller: "hover:text-warning",
  },
  { variable: "--breadcrumb-display", prop: "display", render: breadcrumb("nav"), caller: "flex" },
  {
    variable: "--breadcrumb-display",
    prop: "display",
    render: breadcrumb("nav"),
    caller: "hidden",
  },
  {
    variable: "--sidebar-menu-button-font-size",
    prop: "fontSize",
    byId: true,
    render: sidebarButton(),
    caller: "text-lg",
  },
  {
    variable: "--sidebar-menu-button-padding",
    prop: "paddingTop",
    byId: true,
    render: sidebarButton(),
    caller: "p-4",
  },
  {
    variable: "--sidebar-menu-button-height",
    prop: "height",
    byId: true,
    render: sidebarButton(),
    caller: "h-12",
  },
  {
    variable: "--sidebar-menu-button-radius",
    prop: "borderTopLeftRadius",
    byId: true,
    render: sidebarButton(),
    caller: "rounded-none",
  },
  {
    variable: "--sidebar-menu-button-bg-active",
    prop: "backgroundColor",
    byId: true,
    render: sidebarButton({ isActive: true }),
    caller: "data-[active=true]:bg-warning",
  },
  {
    variable: "--sidebar-menu-button-bg-hover",
    prop: "backgroundColor",
    state: "hover",
    byId: true,
    render: sidebarButton(),
    caller: "hover:bg-warning",
  },
  {
    variable: "--sidebar-menu-button-height-sm",
    prop: "height",
    byId: true,
    render: sidebarButton({ size: "sm" }),
    caller: "h-12",
  },
  {
    variable: "--sidebar-bg",
    prop: "backgroundColor",
    target: "[data-slot=sidebar]",
    plainOnly: true,
    render: sidebarButton(),
    caller: "",
  },
  {
    variable: "--sidebar-wrapper-width",
    prop: "width",
    byId: true,
    render: sidebarWidth,
    caller: "style: --sidebar-width: 10rem",
  },

  // ---- overlays (opened pass) ----
  {
    variable: "--dialog-content-radius",
    prop: "borderTopLeftRadius",
    overlay: true,
    byId: true,
    render: (c, mark) => (
      <Dialog open modal={false}>
        <DialogContent {...mark} className={c}>
          <DialogTitle>Title</DialogTitle>
          <DialogDescription>Text</DialogDescription>
        </DialogContent>
      </Dialog>
    ),
    caller: "rounded-none",
  },
  {
    variable: "--dialog-title-font-size",
    prop: "fontSize",
    overlay: true,
    byId: true,
    render: (c, mark) => (
      <Dialog open modal={false}>
        <DialogContent>
          <DialogTitle {...mark} className={c}>
            Title
          </DialogTitle>
          <DialogDescription>Text</DialogDescription>
        </DialogContent>
      </Dialog>
    ),
    caller: "text-xs",
  },
  {
    variable: "--alert-dialog-content-padding",
    prop: "paddingTop",
    overlay: true,
    byId: true,
    render: (c, mark) => (
      <AlertDialog open>
        <AlertDialogContent {...mark} className={c}>
          <AlertDialogTitle>Title</AlertDialogTitle>
          <AlertDialogDescription>Text</AlertDialogDescription>
        </AlertDialogContent>
      </AlertDialog>
    ),
    caller: "p-2",
  },
  {
    variable: "--sheet-content-bg",
    prop: "backgroundColor",
    overlay: true,
    byId: true,
    render: (c, mark) => (
      <Sheet open modal={false}>
        <SheetContent {...mark} className={c}>
          <SheetTitle>Title</SheetTitle>
          <SheetDescription>Text</SheetDescription>
        </SheetContent>
      </Sheet>
    ),
    caller: "bg-warning",
  },
  {
    variable: "--drawer-content-bg",
    prop: "backgroundColor",
    overlay: true,
    byId: true,
    render: (c, mark) => (
      <Drawer open modal={false}>
        <DrawerContent {...mark} className={c}>
          <DrawerTitle>Title</DrawerTitle>
          <DrawerDescription>Text</DrawerDescription>
        </DrawerContent>
      </Drawer>
    ),
    caller: "bg-warning",
  },
  {
    variable: "--popover-content-padding",
    prop: "paddingTop",
    overlay: true,
    byId: true,
    render: (c, mark) => (
      <Popover open>
        <PopoverTrigger>Anchor</PopoverTrigger>
        <PopoverContent {...mark} className={c}>
          {overlayText}
        </PopoverContent>
      </Popover>
    ),
    caller: "p-2",
  },
  {
    variable: "--hover-card-content-radius",
    prop: "borderTopLeftRadius",
    overlay: true,
    byId: true,
    render: (c, mark) => (
      <HoverCard open>
        <HoverCardTrigger>Anchor</HoverCardTrigger>
        <HoverCardContent {...mark} className={c}>
          {overlayText}
        </HoverCardContent>
      </HoverCard>
    ),
    caller: "rounded-none",
  },
  {
    variable: "--tooltip-content-bg",
    prop: "backgroundColor",
    overlay: true,
    byId: true,
    render: (c, mark) => (
      <Tooltip open>
        <TooltipTrigger>Anchor</TooltipTrigger>
        <TooltipContent {...mark} className={c}>
          {overlayText}
        </TooltipContent>
      </Tooltip>
    ),
    caller: "bg-warning",
  },
  {
    variable: "--dropdown-menu-content-padding",
    prop: "paddingLeft",
    overlay: true,
    byId: true,
    render: (c, mark) => (
      <DropdownMenu open modal={false}>
        <DropdownMenuTrigger>Anchor</DropdownMenuTrigger>
        <DropdownMenuContent {...mark} className={c}>
          <DropdownMenuItem>Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    caller: "p-4",
  },
  {
    variable: "--dropdown-menu-item-font-size",
    prop: "fontSize",
    overlay: true,
    byId: true,
    render: (c, mark) => (
      <DropdownMenu open modal={false}>
        <DropdownMenuTrigger>Anchor</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem {...mark} className={c}>
            Item
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    caller: "text-lg",
  },
  {
    variable: "--select-item-padding-y",
    prop: "paddingTop",
    overlay: true,
    byId: true,
    render: (c, mark) => (
      <Select open defaultValue="a">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a" {...mark} className={c}>
            One
          </SelectItem>
        </SelectContent>
      </Select>
    ),
    caller: "py-4",
  },
  {
    variable: "--select-content-radius",
    prop: "borderTopLeftRadius",
    overlay: true,
    byId: true,
    render: (c, mark) => (
      <Select open defaultValue="a">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent {...mark} className={c}>
          <SelectItem value="a">One</SelectItem>
        </SelectContent>
      </Select>
    ),
    caller: "rounded-none",
  },
  {
    variable: "--select-content-padding",
    prop: "paddingTop",
    overlay: true,
    byId: true,
    target: "[data-radix-select-viewport]",
    plainOnly: true,
    render: (_c, mark) => (
      <Select open defaultValue="a">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent {...mark}>
          <SelectItem value="a">One</SelectItem>
        </SelectContent>
      </Select>
    ),
    caller: "",
  },
];
