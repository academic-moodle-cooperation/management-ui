"use client";

import * as React from "react";

import { cn } from "../../lib/utils";

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div data-slot="table-container" className="relative w-full overflow-x-auto">
      <table
        data-slot="table"
        className={cn(
          "w-full caption-bottom text-[length:var(--table-font-size,0.875rem)]/[var(--table-line-height,calc(1.25/0.875))]",
          className,
        )}
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return <thead data-slot="table-header" className={cn("[&_tr]:border-b", className)} {...props} />;
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-[color:var(--table-footer-bg,color-mix(in_oklab,var(--muted)_50%,transparent))] border-t font-[number:var(--table-footer-font-weight,500)] [&>tr]:last:border-b-0",
        className,
      )}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "hover:bg-[color:var(--table-row-bg-hover,color-mix(in_oklab,var(--muted)_50%,transparent))] data-[state=selected]:bg-[color:var(--table-row-bg-selected,var(--muted))] border-b transition-colors",
        className,
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "text-[color:var(--table-head-color,var(--foreground))] h-[var(--table-head-height,2.5rem)] px-[var(--table-head-padding-x,0.5rem)] text-left align-middle font-[number:var(--table-head-font-weight,500)] whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-[var(--table-cell-padding,0.5rem)] align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className,
      )}
      {...props}
    />
  );
}

function TableCaption({ className, ...props }: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn(
        "text-[color:var(--table-caption-color,var(--muted-foreground))] mt-4 text-[length:var(--table-caption-font-size,0.875rem)]/[var(--table-caption-line-height,calc(1.25/0.875))]",
        className,
      )}
      {...props}
    />
  );
}

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
