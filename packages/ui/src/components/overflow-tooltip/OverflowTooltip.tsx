import { FC, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components";
import { cn } from "@workspace/ui/lib";

interface OverflowTooltipProps {
  className?: string;
  children: React.ReactNode | null;
  text?: string;
}

const OverflowTooltip: FC<OverflowTooltipProps> = ({
  className,
  children,
  text,
  ...props
}) => {
  const [needsTooltip, setNeedsTooltip] = useState(false);
  const [overflowingVertical, setOverflowingVertical] = useState(false);

  const checkOverflow = (el: HTMLElement | null) => {
    if (el) {
      const isOverflowingVertical = el.clientHeight < el.scrollHeight;
      const isOverflowing =
        el.clientWidth < el.scrollWidth || isOverflowingVertical;
      if (isOverflowing) {
        setNeedsTooltip(true);
        setOverflowingVertical(isOverflowingVertical);
      } else {
        setNeedsTooltip(false);
      }
    }
  };

  if (!children) {
    return null;
  }

  if (overflowingVertical) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              className,
              overflowingVertical && "underline decoration-dotted"
            )}
            ref={(el) => {
              checkOverflow(el);
            }}
          >
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent className="block whitespace-pre w-auto">
          {text || children}
        </TooltipContent>
      </Tooltip>
    );
  }

  return needsTooltip ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(className)}
          ref={(el) => {
            checkOverflow(el);
          }}
        >
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent>{text || children}</TooltipContent>
    </Tooltip>
  ) : (
    <span
      className={cn(className)}
      ref={(el) => {
        checkOverflow(el);
      }}
      {...props}
    >
      {children}
    </span>
  );
};

export { OverflowTooltip };
