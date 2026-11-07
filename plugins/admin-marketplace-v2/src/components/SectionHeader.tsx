import { ChevronRight } from "lucide-react";

import type { FC, ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  count?: number;
  /** Right-aligned, quiet: what this section is for. */
  hint?: ReactNode;
}

/** V4's section head: title, a soft chevron, an optional hint on the right. */
const SectionHeader: FC<SectionHeaderProps> = ({ title, count, hint }) => (
  <div className="mb-4 flex items-center gap-1.5">
    <h2 className="font-heading text-[17px] font-semibold tracking-tight">{title}</h2>
    <ChevronRight className="mt-px size-3.5 text-muted-foreground/60" strokeWidth={2.4} />
    {count !== undefined && <span className="ml-1 font-mono text-xs text-muted-foreground">{count}</span>}
    {hint && <span className="ml-auto text-[13px] text-muted-foreground">{hint}</span>}
  </div>
);

export { SectionHeader };
