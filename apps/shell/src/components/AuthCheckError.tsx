/**
 * AuthCheckError
 *
 * Rendered by the route-protection layer (`AppProtection` / `ProtectedRoute`)
 * when the `currentUser` fetch fails with a *non-authentication* error —
 * backend 5xx, network / ECONNREFUSED — and no user could be resolved. Before
 * this existed, a protected route sat on an indefinite "Checking
 * authentication…" spinner with no way to recover.
 *
 * Uses `<ErrorPage code="503">` (Service Unavailable): the shell itself is up,
 * it just can't reach the backend to verify the session. The router package
 * can't import `@oc-mui/ui` (cycle), so the protection components take this as
 * an injected `errorComponent` and the shell supplies this branded screen.
 *
 * "Retry" re-runs the fetch (no full reload needed once the backend is back);
 * "Reload page" is the bigger hammer. Authentication errors (401/403) never
 * reach here — those redirect to `/login`.
 */
import { useTranslation } from "@oc-mui/i18n";
import { Button, ErrorPage } from "@oc-mui/ui/components";

export interface AuthCheckErrorProps {
  /** The error thrown by the `currentUser` fetch. */
  error: unknown;
  /** Re-runs the `currentUser` fetch. Wired to the Retry button. */
  onRetry: () => void;
}

export function AuthCheckError({ error, onRetry }: AuthCheckErrorProps) {
  const { t } = useTranslation();
  const message = error instanceof Error ? error.message : String(error ?? "");

  return (
    <ErrorPage
      code="503"
      title={t("authError.title")}
      description={<p>{t("authError.description")}</p>}
      details={
        message ? (
          <p>
            Error:{" "}
            <code className="text-foreground bg-muted px-1.5 py-0.5 rounded text-xs">
              {message}
            </code>
          </p>
        ) : undefined
      }
      actions={
        <>
          <Button variant="outline" onClick={() => window.location.reload()}>
            {t("configError.reload")}
          </Button>
          <Button onClick={onRetry}>{t("configError.retry")}</Button>
        </>
      }
    />
  );
}
