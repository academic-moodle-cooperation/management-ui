import { cn } from "../../lib/utils";

import type { ReactNode } from "react";

/**
 * Shared layout primitive for full-screen error pages.
 *
 * All of the named error pages in this folder (404, 500, 401, 403, 503,
 * etc.) compose this component — it owns the centered layout, the big
 * status code, the title/description typography, and the actions row.
 * That way the visual language stays consistent across every error
 * surface and individual pages stay small and declarative.
 *
 * Slots:
 *   - `code`     — large status indicator (string, number, or symbol).
 *                  Optional: omit for "no big number" variants.
 *   - `title`    — required short headline (e.g. "Page Not Found").
 *   - `description` — body copy; ReactNode so you can include markup.
 *   - `details`  — secondary slot rendered below the description,
 *                  intended for diagnostic info (URLs, error messages,
 *                  dev-only setup hints). Visually de-emphasised.
 *   - `actions`  — buttons / CTAs row.
 */
// `Omit<…, "title">` because the native HTMLAttributes `title` is a
// tooltip string, which would clash with our richer `title: ReactNode`
// prop and trip TS2430 ("incorrectly extends").
export interface ErrorPageProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Large status indicator shown above the title (e.g. "404"). */
  code?: ReactNode;
  /** Short headline summarising the error. */
  title: ReactNode;
  /** Body copy explaining the error. */
  description?: ReactNode;
  /** Diagnostic detail — URLs, error messages, dev hints. */
  details?: ReactNode;
  /** Actions row (usually `<Button>`s). */
  actions?: ReactNode;
}

export function ErrorPage({
  code,
  title,
  description,
  details,
  actions,
  className,
  ...rest
}: ErrorPageProps) {
  return (
    <div className={cn("h-svh w-full", className)} {...rest}>
      <div className="m-auto flex h-full w-full flex-col items-center justify-center gap-2 px-6">
        {code !== undefined && code !== null && code !== false && (
          <h1 className="text-[7rem] font-bold leading-tight">{code}</h1>
        )}
        <span className="font-medium">{title}</span>
        {description && (
          <div className="text-center text-muted-foreground">{description}</div>
        )}
        {details && (
          <div className="mt-2 max-w-xl w-full text-center text-sm text-muted-foreground">
            {details}
          </div>
        )}
        {actions && <div className="mt-6 flex flex-wrap justify-center gap-4">{actions}</div>}
      </div>
    </div>
  );
}
