import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Avatar,
  AvatarFallback,
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  toast,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@oc-mui/ui/components";

import { SettingsIcon, TrashIcon, VideoIcon } from "../icons";
import { Row, Section } from "../Section";

/**
 * Every overlay takes `open`: the gallery passes `true` for the one named in
 * `?open=<id>`, so a screenshot run can capture the opened state without
 * clicking.
 */
interface OverlayProps {
  open: boolean;
}

export function DialogSection({ open }: OverlayProps) {
  return (
    <Section id="dialog" title="Dialog">
      <Row>
        <Dialog defaultOpen={open}>
          <DialogTrigger asChild>
            <Button variant="outline">Open dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit series</DialogTitle>
              <DialogDescription>Change the title and save when you are done.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-2">
              <Label htmlFor="gallery-dialog-title">Title</Label>
              <Input id="gallery-dialog-title" defaultValue="Algorithms" />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Row>
    </Section>
  );
}

export function AlertDialogSection({ open }: OverlayProps) {
  return (
    <Section id="alert-dialog" title="Alert dialog">
      <Row>
        <AlertDialog defaultOpen={open}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Delete event</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this event?</AlertDialogTitle>
              <AlertDialogDescription>
                The recording and all of its publications are removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Row>
    </Section>
  );
}

export function SheetSection({ open }: OverlayProps) {
  return (
    <Section id="sheet" title="Sheet">
      <Row>
        <Sheet defaultOpen={open}>
          <SheetTrigger asChild>
            <Button variant="outline">Open sheet</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Event details</SheetTitle>
              <SheetDescription>A panel that slides in from the side.</SheetDescription>
            </SheetHeader>
            <div className="grid gap-2 px-4">
              <Label htmlFor="gallery-sheet-title">Title</Label>
              <Input id="gallery-sheet-title" defaultValue="Lecture 1: Introduction" />
            </div>
            <SheetFooter>
              <Button>Save</Button>
              <SheetClose asChild>
                <Button variant="outline">Close</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </Row>
    </Section>
  );
}

export function DrawerSection({ open }: OverlayProps) {
  return (
    <Section id="drawer" title="Drawer">
      <Row>
        <Drawer defaultOpen={open}>
          <DrawerTrigger asChild>
            <Button variant="outline">Open drawer</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Filters</DrawerTitle>
              <DrawerDescription>A panel that slides up from the bottom.</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <Button>Apply</Button>
              <DrawerClose asChild>
                <Button variant="outline">Cancel</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </Row>
    </Section>
  );
}

export function DropdownMenuSection({ open }: OverlayProps) {
  return (
    <Section id="dropdown-menu" title="Dropdown menu">
      <Row>
        <DropdownMenu defaultOpen={open}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Open menu</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Event</DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <VideoIcon />
                Open in editor
                <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <SettingsIcon />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem disabled>Republish</DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem checked>Show thumbnails</DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <TrashIcon />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Row>
    </Section>
  );
}

export function PopoverSection({ open }: OverlayProps) {
  return (
    <Section id="popover" title="Popover">
      <Row>
        <Popover defaultOpen={open}>
          <PopoverTrigger asChild>
            <Button variant="outline">Open popover</Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="grid gap-2">
            <Label htmlFor="gallery-popover-width">Width</Label>
            <Input id="gallery-popover-width" defaultValue="100%" />
          </PopoverContent>
        </Popover>
      </Row>
    </Section>
  );
}

export function HoverCardSection({ open }: OverlayProps) {
  return (
    <Section id="hover-card" title="Hover card">
      <Row>
        <HoverCard defaultOpen={open}>
          <HoverCardTrigger asChild>
            <Button variant="link">Hover for details</Button>
          </HoverCardTrigger>
          <HoverCardContent align="start" className="flex gap-3">
            <Avatar>
              <AvatarFallback>AL</AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <p className="font-medium">A. Lecturer</p>
              <p className="text-muted-foreground">Presenter of 12 events.</p>
            </div>
          </HoverCardContent>
        </HoverCard>
      </Row>
    </Section>
  );
}

export function TooltipSection({ open }: OverlayProps) {
  return (
    <Section id="tooltip" title="Tooltip">
      <Row>
        <Tooltip defaultOpen={open}>
          <TooltipTrigger asChild>
            <Button variant="outline">Hover or focus</Button>
          </TooltipTrigger>
          <TooltipContent>Explains the control</TooltipContent>
        </Tooltip>
      </Row>
    </Section>
  );
}

export function CommandSection() {
  return (
    <Section id="command" title="Command">
      <Command className="w-96 rounded-lg border shadow-md">
        <CommandInput placeholder="Type a command or search…" />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>
          <CommandGroup heading="Go to">
            <CommandItem>
              <VideoIcon />
              Events
              <CommandShortcut>⌘1</CommandShortcut>
            </CommandItem>
            <CommandItem>
              <VideoIcon />
              Series
              <CommandShortcut>⌘2</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Actions">
            <CommandItem>
              <SettingsIcon />
              Settings
            </CommandItem>
            <CommandItem disabled>Disabled entry</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </Section>
  );
}

export function SonnerSection() {
  return (
    <Section id="sonner" title="Sonner (toast)">
      <Row>
        <Button variant="outline" onClick={() => toast("Event saved")}>
          Default
        </Button>
        <Button variant="outline" onClick={() => toast.success("Published")}>
          Success
        </Button>
        <Button variant="outline" onClick={() => toast.warning("Storage almost full")}>
          Warning
        </Button>
        <Button variant="outline" onClick={() => toast.error("Upload failed")}>
          Error
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toast("Event deleted", {
              description: "It stays in the trash for 60 days.",
              action: { label: "Undo", onClick: () => undefined },
            })
          }
        >
          With action
        </Button>
      </Row>
    </Section>
  );
}
