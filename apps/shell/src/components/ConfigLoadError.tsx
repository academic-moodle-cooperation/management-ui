/**
 * ConfigLoadError
 *
 * Rendered by `main.tsx` when `useAppConfig` fails to fetch the deployed
 * `config.json` (typically: backend unreachable from the Vite dev proxy,
 * or a 5xx from the production backend). The shell can't usefully boot
 * without that config, so we replace the indefinite "Loading
 * configuration…" spinner with a proper error page that says what went
 * wrong and how to fix it.
 *
 * Visually composes `<ErrorPage code="502">` from `@oc-mui/ui` so it
 * matches the rest of the error-page family (404 / 500 / 503 / etc.).
 * 502 is what `@oc-mui/vite-config`'s proxy handler actually responds
 * with on ECONNREFUSED, and it's the most honest code in production
 * too — the shell can reach itself but not the upstream backend.
 *
 * Tailored messaging by environment:
 *   - Dev: full instructions including the `VITE_PROXY_TARGET` env var
 *     and a link to the installation docs. Mirrors the boxed notice
 *     `@oc-mui/vite-config`'s proxy handler prints in the terminal.
 *   - Prod: short "couldn't load configuration; contact your
 *     administrator" message, no dev-only setup advice.
 *
 * The "Retry" button calls TanStack Query's `refetch` so the user can
 * recover without a full page reload once the backend is back up.
 */
import { useTranslation } from "@oc-mui/i18n";
import { Button, ErrorPage } from "@oc-mui/ui/components";

export interface ConfigLoadErrorProps {
  /** Error thrown by the config fetch (the `error` returned by `useAppConfig`). */
  error: unknown;
  /** The URL the hook tried to fetch from, surfaced for diagnostics. */
  configUrl?: string | undefined;
  /** Re-runs the fetch. Wired to the Retry button. */
  onRetry: () => void;
}

export function ConfigLoadError({ error, configUrl, onRetry }: ConfigLoadErrorProps) {
  const { t } = useTranslation();
  const isDev = !!import.meta.env.DEV;
  const message = error instanceof Error ? error.message : String(error ?? "");

  return (
    <ErrorPage
      code="502"
      title={t("configError.title")}
      description={
        <p>
          The shell tried to fetch{" "}
          {configUrl ? (
            <code className="text-foreground bg-muted px-1.5 py-0.5 rounded text-sm">
              {configUrl}
            </code>
          ) : (
            "its configuration"
          )}{" "}
          but the request failed.
        </p>
      }
      details={
        <div className="space-y-3">
          {message && (
            <p>
              Error:{" "}
              <code className="text-foreground bg-muted px-1.5 py-0.5 rounded text-xs">
                {message}
              </code>
            </p>
          )}

          {isDev ? (
            <div className="space-y-3 border border-border rounded-md p-4 bg-muted/30 text-left">
              <p className="font-medium text-foreground">
                Looks like you&rsquo;re running <code>pnpm dev</code> without a reachable backend.
              </p>
              <p>Two ways to fix:</p>
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li>
                  Start your local Opencast (or whatever serves <code>/config.json</code>,{" "}
                  <code>/plugins.json</code>, <code>/info/me.json</code>, <code>/graphql</code>) on{" "}
                  <code>http://localhost:8080</code>, then hit Retry.
                </li>
                <li>
                  Point Vite at a different backend:
                  <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                    VITE_PROXY_TARGET=https://your-staging.example.org pnpm dev
                  </pre>
                </li>
              </ol>
              <p>
                The terminal running <code>pnpm dev</code> has more detail, plus a link to{" "}
                <code>docs/getting-started/installation.md</code>.
              </p>
            </div>
          ) : (
            <p>{t("configError.prodMessage")}</p>
          )}
        </div>
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
