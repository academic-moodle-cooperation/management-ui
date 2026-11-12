import type { ReactNode } from "react";

/** One component of the gallery: a heading plus its demo rows. */
export function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} data-gallery-section={id} className="scroll-mt-20 border-b py-8">
      <h2 className="text-muted-foreground mb-4 font-mono text-xs tracking-wide uppercase">
        {title}
      </h2>
      <div className="flex flex-col gap-6">{children}</div>
    </section>
  );
}

/** A labelled row of variants inside a section. */
export function Row({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      {label ? <p className="text-muted-foreground text-xs">{label}</p> : null}
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}
