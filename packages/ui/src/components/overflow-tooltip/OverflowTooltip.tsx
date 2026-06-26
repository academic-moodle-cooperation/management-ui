import { useCallback, useEffect, useRef, useState, type FC } from "react";

import { cn } from "../../lib";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui";

interface OverflowTooltipProps {
  className?: string;
  children: React.ReactNode | null;
  text?: string;
}

const OverflowTooltip: FC<OverflowTooltipProps> = ({ className, children, text, ...props }) => {
  const [needsTooltip, setNeedsTooltip] = useState(false);
  const [overflowingVertical, setOverflowingVertical] = useState(false);
  const elRef = useRef<HTMLElement | null>(null);

  const checkOverflow = useCallback((el: HTMLElement | null) => {
    elRef.current = el;
    if (!el) {
      return;
    }
    const isOverflowingVertical = el.clientHeight < el.scrollHeight;
    const isOverflowing = el.clientWidth < el.scrollWidth || isOverflowingVertical;
    // Assign both flags on every measurement. The first measure runs in the ref
    // callback on mount, which can happen while a fallback font is still in place
    // (web fonts load asynchronously). The fallback's metrics differ, so a
    // clamped multi-line cell can momentarily report a vertical overflow it does
    // not actually have. The previous code only ever set these to `true`, which
    // latched the dotted underline on permanently; re-asserting both flags lets a
    // later, correct measurement clear a false positive again.
    setNeedsTooltip(isOverflowing);
    setOverflowingVertical(isOverflowingVertical);
  }, []);

  // Re-measure once web fonts have finished loading. Nothing else re-triggers a
  // measurement after the font swap, so without this a cell first measured
  // against a fallback font keeps that wrong verdict.
  useEffect(() => {
    const fonts = typeof document !== "undefined" ? document.fonts : undefined;
    if (!fonts?.ready) {
      return;
    }
    let cancelled = false;
    void fonts.ready.then(() => {
      if (!cancelled) {
        checkOverflow(elRef.current);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [checkOverflow]);

  if (!children) {
    return null;
  }

  if (overflowingVertical) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(className, overflowingVertical && "underline decoration-dotted")}
            ref={(el) => {
              checkOverflow(el);
            }}
          >
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent className="block whitespace-pre w-auto">{text || children}</TooltipContent>
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
