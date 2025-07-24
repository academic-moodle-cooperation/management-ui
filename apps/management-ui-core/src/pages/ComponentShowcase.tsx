import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@workspace/ui/components';
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
} from '@workspace/ui/components';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components';
import { Badge } from '@workspace/ui/components';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@workspace/ui/components';
import { Button } from '@workspace/ui/components';
import { Calendar } from '@workspace/ui/components';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@workspace/ui/components';
import { Checkbox } from '@workspace/ui/components';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@workspace/ui/components';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@workspace/ui/components';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@workspace/ui/components';
import { Input } from '@workspace/ui/components';
import { Label } from '@workspace/ui/components';
import { Popover, PopoverContent, PopoverTrigger } from '@workspace/ui/components';
import { ScrollArea, ScrollBar } from '@workspace/ui/components';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components';
import { Separator } from '@workspace/ui/components';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@workspace/ui/components';
import { Toaster as Sonner } from '@workspace/ui/components';
import { toast } from '@workspace/ui/components';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components';
import { Textarea } from '@workspace/ui/components';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@workspace/ui/components';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarInset } from '@workspace/ui/components';
import { ChevronDown, AppLoader } from '@workspace/ui/components';
import { useAppConfig } from '@workspace/ui-config';
import { AuthStatus, AuthMethodsDemo, AuthDebug } from '@workspace/ui/components';
import { RouteProtectionMethods } from '../examples/ProtectedRoutesExample';


export function ComponentShowcase() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [openCommand, setOpenCommand] = React.useState(false);
  const { config, isLoading: isConfigLoading, isError: isConfigError } = useAppConfig();

  // Show loader for config loading only - auth loading is handled by AuthInitializer
  if (isConfigLoading) return <AppLoader />;

  // Handle config errors
  if (isConfigError) return <p>Error loading configuration.</p>;

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpenCommand((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const showToast = () => {
    toast("Event has been created", {
      description: "Sunday, December 03, 2023 at 9:00 AM",
      action: {
        label: "Undo",
        onClick: () => {/* Undo action */},
      },
    })
  }

  return (
    <div className="p-10 space-y-8">
      <Sonner />
      <h1 className="text-3xl font-bold mb-12 text-center">{config.app.appName}</h1>
      {/* Sidebar (Basic example) */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h2 className="text-2xl font-semibold">Sidebar (Simplified Example)</h2>
        <p className="text-sm text-muted-foreground">Note: Full sidebar functionality depends on layout context. This is a basic trigger.</p>
        <SidebarProvider>
          <Sidebar>
            <SidebarHeader>
              <h3 className="font-semibold">My App</h3>
            </SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton>Dashboard</SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive>Analytics</SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
              <p className="text-xs text-muted-foreground">© 2024</p>
            </SidebarFooter>
          </Sidebar>
          <SidebarInset> {/* Needs to wrap the main content for inset variant */}
            <div className="flex items-center gap-2 p-2 border-b">
              <SidebarTrigger />
              <p>Main Content Area (Click icon to toggle sidebar)</p>
            </div>
            <div className="p-4">
              <p>This content would be inside the main application area, pushed by the sidebar if using 'inset' or 'floating' variants that affect layout.</p>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </div>

      {/* Accordion */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h2 className="text-2xl font-semibold">Accordion</h2>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>Is it accessible?</AccordionTrigger>
            <AccordionContent>Yes. It adheres to the WAI-ARIA design pattern.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Is it styled?</AccordionTrigger>
            <AccordionContent>Yes. It comes with default styles that matches the other components' aesthetic.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>Is it animated?</AccordionTrigger>
            <AccordionContent>Yes. It's animated by default, but you can disable it if you prefer.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Alert Dialog */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h2 className="text-2xl font-semibold">Alert Dialog</h2>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline">Show Dialog</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your account and remove your data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Avatar */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h2 className="text-2xl font-semibold">Avatar</h2>
        <div className="flex space-x-2">
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Badge */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h2 className="text-2xl font-semibold">Badge</h2>
        <div className="flex space-x-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h2 className="text-2xl font-semibold">Breadcrumb</h2>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/components">Components</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Button */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h2 className="text-2xl font-semibold">Button</h2>
        <div className="flex flex-wrap gap-2">
          <Button>Default</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button disabled>Disabled</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button size="icon"><ChevronDown className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Calendar */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h2 className="text-2xl font-semibold">Calendar</h2>
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md border"
        />
        <p className="text-sm text-muted-foreground">Selected: {date?.toLocaleDateString()}</p>
      </div>

      {/* Card */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h2 className="text-2xl font-semibold">Card</h2>
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle>Create project</CardTitle>
            <CardDescription>Deploy your new project in one-click.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Card Content</p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline">Cancel</Button>
            <Button>Deploy</Button>
          </CardFooter>
        </Card>
      </div>

      {/* Checkbox */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h2 className="text-2xl font-semibold">Checkbox</h2>
        <div className="flex items-center space-x-2">
          <Checkbox id="terms" />
          <Label htmlFor="terms">Accept terms and conditions</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="terms-disabled" disabled />
          <Label htmlFor="terms-disabled">Disabled</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="terms-checked" defaultChecked />
          <Label htmlFor="terms-checked">Default Checked</Label>
        </div>
      </div>

      {/* Command */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h2 className="text-2xl font-semibold">Command</h2>
        <p className="text-sm text-muted-foreground">
          Press <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd> to open the command palette.
        </p>
        <CommandDialog open={openCommand} onOpenChange={setOpenCommand}>
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Suggestions">
              <CommandItem>Calendar</CommandItem>
              <CommandItem>Search Emoji</CommandItem>
              <CommandItem>Calculator</CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Settings">
              <CommandItem>Profile</CommandItem>
              <CommandItem>Billing</CommandItem>
              <CommandItem>Settings</CommandItem>
            </CommandGroup>
          </CommandList>
        </CommandDialog>
        <p className="text-xs text-muted-foreground mt-2">Basic inline Command (not dialog):</p>
        <Command className="rounded-lg border shadow-md w-full max-w-xs">
          <CommandInput placeholder="Type something..." />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup heading="Letters">
              <CommandItem>a</CommandItem>
              <CommandItem>b</CommandItem>
              <CommandSeparator />
              <CommandItem>c</CommandItem>
            </CommandGroup>
            <CommandItem>Apple</CommandItem>
          </CommandList>
        </Command>
      </div>

      {/* Dialog */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h2 className="text-2xl font-semibold">Dialog</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Edit Profile</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit profile</DialogTitle>
              <DialogDescription>
                Make changes to your profile here. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input id="name" defaultValue="Pedro Duarte" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="username" className="text-right">Username</Label>
                <Input id="username" defaultValue="@peduarte" className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dropdown Menu */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h2 className="text-2xl font-semibold">Dropdown Menu</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Open Menu</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                Profile
                <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>
                Billing
                <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>
                Settings
                <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>
                Keyboard shortcuts
                <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>Team</DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Invite users</DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem>Email</DropdownMenuItem>
                    <DropdownMenuItem>Message</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>More...</DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
              <DropdownMenuItem>
                New Team
                <DropdownMenuShortcut>⌘+T</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>GitHub</DropdownMenuItem>
            <DropdownMenuItem>Support</DropdownMenuItem>
            <DropdownMenuItem disabled>API</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              Log out
              <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Input */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h2 className="text-2xl font-semibold">Input</h2>
        <Input type="email" placeholder="Email" className="max-w-sm" />
        <Input type="text" placeholder="Disabled" disabled className="max-w-sm" />
      </div>

      {/* Label */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h2 className="text-2xl font-semibold">Label</h2>
        <div className="flex items-center space-x-2">
          <Checkbox id="label-example" />
          <Label htmlFor="label-example">This is a label for the checkbox</Label>
        </div>
      </div>

      {/* Popover */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h2 className="text-2xl font-semibold">Popover</h2>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Open popover</Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Dimensions</h4>
                <p className="text-sm text-muted-foreground">
                  Set the dimensions for the layer.
                </p>
              </div>
              <div className="grid gap-2">
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="width">Width</Label>
                  <Input id="width" defaultValue="100%" className="col-span-2 h-8" />
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="maxWidth">Max. width</Label>
                  <Input id="maxWidth" defaultValue="300px" className="col-span-2 h-8" />
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="height">Height</Label>
                  <Input id="height" defaultValue="25px" className="col-span-2 h-8" />
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="maxHeight">Max. height</Label>
                  <Input id="maxHeight" defaultValue="none" className="col-span-2 h-8" />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Scroll Area */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h2 className="text-2xl font-semibold">Scroll Area</h2>
        <ScrollArea className="h-72 w-48 rounded-md border">
          <div className="p-4">
            <h4 className="mb-4 text-sm font-medium leading-none">Tags</h4>
            {Array.from({ length: 50 }).map((_, i, a) => (
              <React.Fragment key={i}>
                <div>Tag {i + 1}</div>
                {i < a.length - 1 && <Separator className="my-2" />}
              </React.Fragment>
            ))}
          </div>
          <ScrollBar orientation="vertical" />
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Select */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h2 className="text-2xl font-semibold">Select</h2>
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a fruit" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Fruits</SelectLabel>
              <SelectItem value="apple">Apple</SelectItem>
              <SelectItem value="banana">Banana</SelectItem>
              <SelectItem value="blueberry">Blueberry</SelectItem>
              <SelectItem value="grapes">Grapes</SelectItem>
              <SelectItem value="pineapple">Pineapple</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Separator */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h2 className="text-2xl font-semibold">Separator</h2>
        <div>
          <div className="space-y-1">
            <h4 className="text-sm font-medium leading-none">Radix Primitives</h4>
            <p className="text-sm text-muted-foreground">
              An open-source UI component library.
            </p>
          </div>
          <Separator className="my-4" />
          <div className="flex h-5 items-center space-x-4 text-sm">
            <div>Blog</div>
            <Separator orientation="vertical" />
            <div>Docs</div>
            <Separator orientation="vertical" />
            <div>Source</div>
          </div>
        </div>
      </div>

      {/* Sheet */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h2 className="text-2xl font-semibold">Sheet</h2>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">Open Sheet</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Edit profile</SheetTitle>
              <SheetDescription>
                Make changes to your profile here. Click save when you're done.
              </SheetDescription>
            </SheetHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name-sheet" className="text-right">Name</Label>
                <Input id="name-sheet" defaultValue="Pedro Duarte" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="username-sheet" className="text-right">Username</Label>
                <Input id="username-sheet" defaultValue="@peduarte" className="col-span-3" />
              </div>
            </div>
            {/* SheetFooter example can be added here if needed */}
          </SheetContent>
        </Sheet>
      </div>

      {/* Sonner (Toast) */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h2 className="text-2xl font-semibold">Sonner (Toast)</h2>
        <Button onClick={showToast}>Show Toast</Button>
      </div>

      {/* Table */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h2 className="text-2xl font-semibold">Table</h2>
        <Table>
          <TableCaption>A list of your recent invoices.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Invoice</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Method</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">INV001</TableCell>
              <TableCell>Paid</TableCell>
              <TableCell>Credit Card</TableCell>
              <TableCell className="text-right">$250.00</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">INV002</TableCell>
              <TableCell>Pending</TableCell>
              <TableCell>PayPal</TableCell>
              <TableCell className="text-right">$150.00</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Tabs */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h2 className="text-2xl font-semibold">Tabs</h2>
        <Tabs defaultValue="account" className="w-[400px]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
          </TabsList>
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account</CardTitle>
                <CardDescription>
                  Make changes to your account here. Click save when you're done.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="name-tabs">Name</Label>
                  <Input id="name-tabs" defaultValue="Pedro Duarte" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="username-tabs">Username</Label>
                  <Input id="username-tabs" defaultValue="@peduarte" />
                </div>
              </CardContent>
              <CardFooter>
                <Button>Save changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="password">
            <Card>
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>
                  Change your password here. After saving, you'll be logged out.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="current-password">Current password</Label>
                  <Input id="current-password" type="password" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="new-password">New password</Label>
                  <Input id="new-password" type="password" />
                </div>
              </CardContent>
              <CardFooter>
                <Button>Save password</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Textarea */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h2 className="text-2xl font-semibold">Textarea</h2>
        <Textarea placeholder="Type your message here." />
      </div>

      {/* Tooltip */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h2 className="text-2xl font-semibold">Tooltip</h2>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Hover me</Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add to library</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Authentication Status */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h2 className="text-2xl font-semibold">Authentication Status</h2>
        <p className="text-sm text-muted-foreground">
          This component demonstrates how to check user authentication status and display user information.
        </p>
        <AuthStatus />
      </div>

      {/* Authentication Debug */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h2 className="text-2xl font-semibold">🔍 Authentication Debug</h2>
        <p className="text-sm text-muted-foreground">
          Detailed debugging information to troubleshoot authentication issues.
        </p>
        <AuthDebug />
      </div>

      {/* Authentication Methods Demo */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h2 className="text-2xl font-semibold">Authentication Methods</h2>
        <p className="text-sm text-muted-foreground">
          Compare the two authentication methods: direct config URLs vs route-based authentication.
        </p>
        <AuthMethodsDemo />
      </div>

      {/* Route Protection Methods */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h2 className="text-2xl font-semibold">Route Protection Methods</h2>
        <p className="text-sm text-muted-foreground">
          Explore different ways to protect routes and components at various levels.
        </p>
        <RouteProtectionMethods />
      </div>

    </div>
  );
} 