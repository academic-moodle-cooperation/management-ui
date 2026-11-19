import { cn } from "../../lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "bg-[color:var(--skeleton-bg,var(--accent))] animate-pulse rounded-[var(--skeleton-radius,calc(var(--radius)_-_2px))]",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
