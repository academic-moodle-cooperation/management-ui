import { cn } from "../lib/utils";

import { AppHeading } from "./appheading";
import { Container } from "./container";
import { Separator } from "./ui/separator";

import type { FC, ReactNode } from "react";

interface PageShellProps {
  /** Page title — one typographic level for every page (rendered by AppHeading). */
  title: string;
  description?: string;
  /** Right-aligned slot next to the heading (filters, primary actions, …). */
  actions?: ReactNode;
  children: ReactNode;
  /** Escape hatch on the outer container (e.g. a page-specific max-width). */
  className?: string;
}

/**
 * The standard frame for a content page (#257).
 *
 * Every page used to carry its own copy of padding, heading markup and
 * separator — episodes/series agreed with each other, upload drifted a
 * little, the marketplace did its own thing entirely. This codifies the one
 * layout: uniform page padding, the title in the same place and type scale
 * on every page, an optional description under it, an optional right-aligned
 * actions slot, a separator, then the content.
 *
 * Deliberately NOT used by the landing page — that is a marketing surface
 * with its own hero typography, not a content page.
 */
const PageShell: FC<PageShellProps> = ({ title, description, actions, children, className }) => {
  return (
    <Container className={cn("p-8", className)}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <AppHeading heading={title} {...(description !== undefined && { description })} />
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <Separator className="mt-4 mb-8" />
      {children}
    </Container>
  );
};

export { PageShell };
