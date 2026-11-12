import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Input,
  Label,
  ScrollArea,
  Separator,
  Skeleton,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@oc-mui/ui/components";

import { ChevronDownIcon } from "../icons";
import { Row, Section } from "../Section";

export function CardSection() {
  return (
    <Section id="card" title="Card">
      <div className="flex flex-wrap items-start gap-3">
        <Card className="w-80">
          <CardHeader>
            <CardTitle>Recording settings</CardTitle>
            <CardDescription>Applies to every new event in this series.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Label htmlFor="gallery-card-input">Presenter</Label>
            <Input id="gallery-card-input" defaultValue="A. Lecturer" />
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button variant="outline">Cancel</Button>
            <Button>Save</Button>
          </CardFooter>
        </Card>
        <Card className="w-80">
          <CardHeader>
            <CardTitle>With an action</CardTitle>
            <CardDescription>Header with a slot on the right.</CardDescription>
            <CardAction>
              <Button variant="outline" size="sm">
                Edit
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-sm">Content only, no footer.</p>
          </CardContent>
        </Card>
        <Card className="w-80">
          <CardContent>
            <p className="text-sm">Content only, no header and no footer.</p>
          </CardContent>
        </Card>
      </div>
    </Section>
  );
}

const EVENTS = [
  {
    title: "Lecture 1: Introduction",
    series: "Algorithms",
    status: "Published",
    duration: "1:28:10",
  },
  { title: "Lecture 2: Sorting", series: "Algorithms", status: "Processing", duration: "1:31:45" },
  { title: "Guest talk", series: "Colloquium", status: "Scheduled", duration: "0:45:00" },
];

export function TableSection() {
  return (
    <Section id="table" title="Table">
      <Table>
        <TableCaption>Recent events</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Series</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Duration</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {EVENTS.map((event, index) => (
            <TableRow key={event.title} data-state={index === 1 ? "selected" : undefined}>
              <TableCell className="font-medium">{event.title}</TableCell>
              <TableCell>{event.series}</TableCell>
              <TableCell>
                <Badge variant={index === 0 ? "default" : "secondary"}>{event.status}</Badge>
              </TableCell>
              <TableCell className="text-right">{event.duration}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3}>Total</TableCell>
            <TableCell className="text-right">3:44:55</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </Section>
  );
}

export function AvatarSection() {
  return (
    <Section id="avatar" title="Avatar">
      <Row>
        <Avatar>
          <AvatarFallback>AL</AvatarFallback>
        </Avatar>
        <Avatar className="size-10">
          <AvatarFallback>BK</AvatarFallback>
        </Avatar>
        <Avatar className="rounded-lg">
          <AvatarFallback className="rounded-lg">CM</AvatarFallback>
        </Avatar>
      </Row>
    </Section>
  );
}

export function SkeletonSection() {
  return (
    <Section id="skeleton" title="Skeleton">
      <Row>
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="grid gap-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-24 w-40 rounded-xl" />
      </Row>
    </Section>
  );
}

export function SeparatorSection() {
  return (
    <Section id="separator" title="Separator">
      <div className="w-80">
        <p className="text-sm">Above</p>
        <Separator className="my-3" />
        <div className="flex h-5 items-center gap-3 text-sm">
          <span>Left</span>
          <Separator orientation="vertical" />
          <span>Middle</span>
          <Separator orientation="vertical" />
          <span>Right</span>
        </div>
      </div>
    </Section>
  );
}

export function AccordionSection() {
  return (
    <Section id="accordion" title="Accordion">
      <Accordion type="single" collapsible defaultValue="first" className="w-96">
        <AccordionItem value="first">
          <AccordionTrigger>Open item</AccordionTrigger>
          <AccordionContent>The content of the first item is visible.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="second">
          <AccordionTrigger>Closed item</AccordionTrigger>
          <AccordionContent>Hidden until opened.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="third">
          <AccordionTrigger disabled>Disabled item</AccordionTrigger>
          <AccordionContent>Never shown.</AccordionContent>
        </AccordionItem>
      </Accordion>
    </Section>
  );
}

export function CollapsibleSection() {
  return (
    <Section id="collapsible" title="Collapsible">
      <Collapsible defaultOpen className="w-80">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm">
            Advanced options
            <ChevronDownIcon />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 text-sm">
          Content that can be folded away.
        </CollapsibleContent>
      </Collapsible>
    </Section>
  );
}

export function ScrollAreaSection() {
  return (
    <Section id="scroll-area" title="Scroll area">
      <ScrollArea className="h-40 w-64 rounded-md border">
        <div className="p-3">
          {Array.from({ length: 20 }, (_, index) => (
            <p key={index} className="py-1 text-sm">
              Row {index + 1}
            </p>
          ))}
        </div>
      </ScrollArea>
    </Section>
  );
}
