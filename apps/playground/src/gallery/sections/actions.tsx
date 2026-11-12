import {
  Badge,
  Button,
  type BadgeVariant,
  type ButtonSize,
  type ButtonVariant,
} from "@oc-mui/ui/components";

import { ChevronDownIcon, PlusIcon, TrashIcon } from "../icons";
import { Row, Section } from "../Section";

const BUTTON_VARIANTS: ButtonVariant[] = [
  "default",
  "secondary",
  "outline",
  "ghost",
  "destructive",
  "link",
];
const TEXT_SIZES: ButtonSize[] = ["sm", "default", "lg"];
const BADGE_VARIANTS: BadgeVariant[] = ["default", "secondary", "outline", "destructive"];

export function ButtonSection() {
  return (
    <Section id="button" title="Button">
      <Row label="Variants">
        {BUTTON_VARIANTS.map((variant) => (
          <Button key={variant} variant={variant}>
            {variant}
          </Button>
        ))}
      </Row>
      <Row label="Sizes">
        {TEXT_SIZES.map((size) => (
          <Button key={size} size={size}>
            Size {size}
          </Button>
        ))}
        {TEXT_SIZES.map((size) => (
          <Button key={size} size={size} variant="outline">
            Size {size}
          </Button>
        ))}
      </Row>
      <Row label="With icon">
        <Button>
          <PlusIcon />
          New event
        </Button>
        <Button variant="outline" size="sm">
          Actions
          <ChevronDownIcon />
        </Button>
        <Button variant="destructive">
          <TrashIcon />
          Delete
        </Button>
        <Button size="icon" aria-label="Add">
          <PlusIcon />
        </Button>
        <Button size="icon" variant="outline" aria-label="Add">
          <PlusIcon />
        </Button>
        <Button size="icon" variant="ghost" aria-label="Delete">
          <TrashIcon />
        </Button>
      </Row>
      <Row label="States">
        <Button disabled>Disabled</Button>
        <Button variant="outline" disabled>
          Disabled
        </Button>
        <Button variant="outline" aria-invalid>
          Invalid
        </Button>
        <Button asChild variant="link">
          <a href="#button">As link element</a>
        </Button>
      </Row>
    </Section>
  );
}

export function BadgeSection() {
  return (
    <Section id="badge" title="Badge">
      <Row label="Variants">
        {BADGE_VARIANTS.map((variant) => (
          <Badge key={variant} variant={variant}>
            {variant}
          </Badge>
        ))}
      </Row>
      <Row label="With icon, as link">
        <Badge>
          <PlusIcon />
          Published
        </Badge>
        <Badge variant="secondary">12</Badge>
        <Badge asChild variant="outline">
          <a href="#badge">Link badge</a>
        </Badge>
      </Row>
    </Section>
  );
}
