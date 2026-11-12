import {
  Calendar,
  Checkbox,
  Input,
  Label,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
} from "@oc-mui/ui/components";

import { Row, Section } from "../Section";

export function InputSection() {
  return (
    <Section id="input" title="Input">
      <Row label="States">
        <Input className="w-64" placeholder="Placeholder" />
        <Input className="w-64" defaultValue="With a value" />
        <Input className="w-64" defaultValue="Disabled" disabled />
        <Input className="w-64" defaultValue="Invalid" aria-invalid />
      </Row>
      <Row label="Types">
        <Input className="w-64" type="search" placeholder="Search…" />
        <Input className="w-64" type="number" defaultValue={42} />
        <Input className="w-64" type="file" />
      </Row>
    </Section>
  );
}

export function TextareaSection() {
  return (
    <Section id="textarea" title="Textarea">
      <Row>
        <Textarea className="w-80" placeholder="Placeholder" />
        <Textarea
          className="w-80"
          defaultValue="A description that runs over more than one line."
        />
        <Textarea className="w-80" defaultValue="Disabled" disabled />
      </Row>
    </Section>
  );
}

export function LabelSection() {
  return (
    <Section id="label" title="Label">
      <Row label="Field">
        <div className="grid w-64 gap-2">
          <Label htmlFor="gallery-title">Title</Label>
          <Input id="gallery-title" defaultValue="Introduction to algorithms" />
        </div>
        <div className="group grid w-64 gap-2" data-disabled="true">
          <Label htmlFor="gallery-disabled">Disabled field</Label>
          <Input id="gallery-disabled" disabled defaultValue="Read only" />
        </div>
      </Row>
    </Section>
  );
}

export function CheckboxSection() {
  return (
    <Section id="checkbox" title="Checkbox">
      <Row>
        <div className="flex items-center gap-2">
          <Checkbox id="gallery-check-off" />
          <Label htmlFor="gallery-check-off">Unchecked</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="gallery-check-on" defaultChecked />
          <Label htmlFor="gallery-check-on">Checked</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="gallery-check-disabled" defaultChecked disabled />
          <Label htmlFor="gallery-check-disabled">Disabled</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="gallery-check-invalid" aria-invalid />
          <Label htmlFor="gallery-check-invalid">Invalid</Label>
        </div>
      </Row>
    </Section>
  );
}

export function SwitchSection() {
  return (
    <Section id="switch" title="Switch">
      <Row>
        <div className="flex items-center gap-2">
          <Switch id="gallery-switch-off" />
          <Label htmlFor="gallery-switch-off">Off</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="gallery-switch-on" defaultChecked />
          <Label htmlFor="gallery-switch-on">On</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="gallery-switch-disabled" defaultChecked disabled />
          <Label htmlFor="gallery-switch-disabled">Disabled</Label>
        </div>
      </Row>
    </Section>
  );
}

function DemoSelect({
  size,
  defaultOpen,
  ...props
}: { size?: "sm" | "default"; defaultOpen?: boolean } & React.ComponentProps<typeof Select>) {
  return (
    <Select defaultOpen={defaultOpen ?? false} {...props}>
      <SelectTrigger className="w-48" {...(size ? { size } : {})}>
        <SelectValue placeholder="Choose a status" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Status</SelectLabel>
          <SelectItem value="published">Published</SelectItem>
          <SelectItem value="processing">Processing</SelectItem>
          <SelectItem value="scheduled">Scheduled</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectItem value="failed" disabled>
          Failed
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

export function SelectSection({ open }: { open: boolean }) {
  return (
    <Section id="select" title="Select">
      <Row label="Sizes and states">
        <DemoSelect defaultOpen={open} />
        <DemoSelect defaultValue="published" />
        <DemoSelect size="sm" defaultValue="processing" />
        <DemoSelect disabled />
      </Row>
    </Section>
  );
}

// A fixed month keeps screenshots comparable from one day to the next.
const CALENDAR_MONTH = new Date(2026, 0, 1);
const CALENDAR_SELECTED = new Date(2026, 0, 14);

export function CalendarSection() {
  return (
    <Section id="calendar" title="Calendar">
      <Row>
        <Calendar
          mode="single"
          defaultMonth={CALENDAR_MONTH}
          selected={CALENDAR_SELECTED}
          today={CALENDAR_MONTH}
          className="rounded-md border"
        />
      </Row>
    </Section>
  );
}
