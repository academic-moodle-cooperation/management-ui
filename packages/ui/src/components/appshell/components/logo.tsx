import * as React from "react";

import { cn } from "../../../lib/utils";

interface LogoProps {
  color?: string;
  fontFamily?: string;
  collapsed?: boolean;
  className?: string;
}

const Logo = ({
  fontFamily = "Georgia, Times New Roman, serif",
  collapsed = false,
  className,
  ...props
}: LogoProps & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <span
      className={cn(
        "truncate font-semibold transition-all duration-300",
        !collapsed ? "w-full py-4" : "w-10 flex items-center justify-center",
      )}
    >
      <div
        className={cn(
          "h-9 flex items-center transition-all duration-300 ease-in-out p-2 justify-center",
          collapsed ? "w-6 p-1 w-auto" : "w-full",
          className,
        )}
        style={{ fontFamily }}
        {...props}
      >
        <div className="flex items-center">
          {/* Square with M - using exact dimensions */}
          <div
            className={cn(
              "flex items-center justify-center transition-all duration-300 bg-primary",
              collapsed ? " w-6 h-6 " : " w-9 h-9",
            )}
          >
            {/* Position the M exactly like in the SVG */}
            <span
              className={cn(
                "text-white font-normal transition-all duration-300 leading-none",
                collapsed ? "text-base" : "text-2xl ",
              )}
            >
              M
            </span>
          </div>

          {/* ANAGEMENT UI text with precise positioning */}
          <div
            className={cn(
              "transition-opacity duration-300 text-2xl font-normal ml-0.5 leading-none",
              collapsed ? "opacity-0 w-0" : "opacity-100 w-auto",
            )}
          >
            ANAGEMENT UI
          </div>
        </div>
      </div>
    </span>
  );
};

export { Logo };
