import React from "react";

/**
 * A minimal loader component used by ComponentResolver
 * when waiting for plugin components to initialize
 */
export const ComponentLoader: React.FC<{
  /**
   * Optional custom label text
   * @default "Loading component..."
   */
  label?: string;
  /**
   * Visual style of the loader
   * @default "minimal"
   */
  variant?: "minimal" | "spinner" | "dots";
}> = ({ label = "Loading component...", variant = "minimal" }) => {
  if (variant === "minimal") {
    return (
      <div className="flex items-center justify-center p-2 text-xs text-muted-foreground">
        {label}
      </div>
    );
  }

  if (variant === "spinner") {
    return (
      <div className="flex items-center justify-center p-2">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        <span className="ml-2 text-xs text-muted-foreground">{label}</span>
      </div>
    );
  }

  if (variant === "dots") {
    return (
      <div className="flex items-center justify-center p-2">
        <div className="flex space-x-1">
          <div className="h-2 w-2 animate-pulse rounded-full bg-primary"></div>
          <div className="h-2 w-2 animate-pulse rounded-full bg-primary animation-delay-200"></div>
          <div className="h-2 w-2 animate-pulse rounded-full bg-primary animation-delay-400"></div>
        </div>
        <span className="ml-2 text-xs text-muted-foreground">{label}</span>
      </div>
    );
  }

  return null;
};
