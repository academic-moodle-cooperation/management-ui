import { cn } from "../../lib/utils";

interface LoadingProps {
  className?: string;
  children?: React.ReactNode;
  centered?: boolean;
}

export function Loading({ className, children, centered = true }: LoadingProps) {
  const spinner = (
    <div className={cn("w-24 h-24 border-8 border-primary border-solid rounded-full border-t-transparent animate-spin", className)}></div>
  );

  const content = children ? (
    <div className="flex flex-col items-center gap-3">
      {spinner}
      {typeof children === 'string' ? (
        <p className="text-sm text-muted-foreground">{children}</p>
      ) : (
        children
      )}
    </div>
  ) : (
    spinner
  );

  if (centered) {
    return (
      <div className="absolute transform translate-x-1/2 translate-y-1/2 right-1/2 bottom-1/2">
        {content}
      </div>
    );
  }

  return content;
}
