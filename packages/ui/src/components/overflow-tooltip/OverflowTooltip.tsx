import { useCallback, useEffect, useRef, useState, type FC } from "react";

/**
 * Vertical overflow has to exceed this many pixels to count. Font metrics alone
 * routinely produce a 1–2px difference between scrollHeight and clientHeight on
 * text that fits; a genuinely clamped cell overflows by a full line.
 */
const VERTICAL_OVERFLOW_SLACK_PX = 4;

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
    // Tolerance, not `<`: a font whose ascenders/descenders are taller than the
    // line box makes scrollHeight exceed clientHeight by a pixel on content that
    // visibly fits on one line. Org themes swap in corporate fonts with exactly
    // such metrics, which underlined *every* cell in a `truncate` (nowrap)
    // column. Only a real clamped overflow crosses a whole line.
    const isOverflowingVertical = el.scrollHeight - el.clientHeight > VERTICAL_OVERFLOW_SLACK_PX;
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

  // `fonts.ready` fires once, when the fonts pending *at that moment* have
  // settled. A plugin theme loaded at runtime (org branding via `app.theme`)
  // registers its @font-face rules afterwards, so its swap never re-triggers the
  // effect above. Observing the element covers that, plus column resizes and
  // zoom changes.
  useEffect(() => {
    const el = elRef.current;
    if (!el || typeof ResizeObserver === "undefined") {
      return;
    }
    const observer = new ResizeObserver(() => checkOverflow(elRef.current));
    observer.observe(el);
    return () => observer.disconnect();
  }, [checkOverflow, needsTooltip, overflowingVertical]);

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
