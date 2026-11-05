import type { FC, MouseEventHandler, ReactNode } from "react";

interface ActionPillProps {
  children: ReactNode;
  /**
   * `neutral`: the V4 "Try it" button — a quiet, bordered pill.
   * `ok`: the V4 "Installed ✓" state — green-tinted, no border.
   * `warning`: an in-this-tab state (previewing).
   */
  tone?: "neutral" | "ok" | "warning";
  size?: "sm" | "md";
  /** With a handler the pill is a button; without, a static status label. */
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  title?: string;
  className?: string;
}

const TONE: Record<NonNullable<ActionPillProps["tone"]>, string> = {
  neutral:
    "border-input bg-accent text-foreground hover:border-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-input",
  ok: "border-transparent bg-ok/15 text-ok",
  warning: "border-transparent bg-warning/15 text-warning",
};

const SIZE: Record<NonNullable<ActionPillProps["size"]>, string> = {
  sm: "px-3 py-[5px] text-xs",
  md: "px-3.5 py-[7px] text-[12.5px]",
};

/**
 * The one button shape of the catalog (V4's `.try-btn` / `.get`): used for
 * Try it, End trial, End preview — and, as a static label, for states such as
 * "Trial active ✓".
 */
const ActionPill: FC<ActionPillProps> = ({
  children,
  tone = "neutral",
  size = "md",
  onClick,
  disabled,
  title,
  className,
}) => {
  const base = `inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border font-semibold transition-colors ${SIZE[size]} ${TONE[tone]} ${className ?? ""}`;
  if (!onClick) {
    return (
      <span className={base} title={title}>
        {children}
      </span>
    );
  }
  return (
    <button
      type="button"
      className={base}
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  );
};

export { ActionPill };
