/**
 * ConfigLoadError
 *
 * Rendered by `main.tsx` when `useAppConfig` fails to fetch the deployed
 * `config.json` (typically: backend unreachable from the Vite dev proxy,
 * or a 5xx from the production backend). The shell can't usefully boot
 * without that config, so we replace the indefinite "Loading
 * configuration…" spinner with a screen that says what went wrong and
 * how to fix it.
 *
 * Tailored messaging by environment:
 *   - Dev: full instructions including the `VITE_PROXY_TARGET` env var
 *     and a link to the installation docs. Mirrors the boxed notice
 *     `@oc-mui/vite-config`'s proxy handler prints in the terminal.
 *   - Prod: short "couldn't load configuration; contact your
 *     administrator" message + the HTTP status, no dev-only setup
 *     advice.
 *
 * The "Retry" button calls TanStack Query's `refetch` so the user can
 * recover without a full page reload once the backend is back up.
 */
import { Button } from "@oc-mui/ui/components";

export interface ConfigLoadErrorProps {
  /** Error thrown by the config fetch (the `error` returned by `useAppConfig`). */
  error: unknown;
  /** The URL the hook tried to fetch from, surfaced for diagnostics. */
  configUrl?: string | undefined;
  /** Re-runs the fetch. Wired to the Retry button. */
  onRetry: () => void;
}

export function ConfigLoadError({ error, configUrl, onRetry }: ConfigLoadErrorProps) {
  const isDev = !!import.meta.env.DEV;
  const message = error instanceof Error ? error.message : String(error ?? "");

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-2xl w-full space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold font-heading text-foreground">
            Couldn&rsquo;t load configuration
          </h1>
          <p className="text-muted-foreground">
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
          {message && (
            <p className="text-sm text-muted-foreground">
              Error: <code className="text-foreground">{message}</code>
            </p>
          )}
        </div>

        {isDev ? (
          <div className="space-y-3 border border-border rounded-md p-4 bg-muted/30">
            <p className="text-sm font-medium text-foreground">
              Looks like you&rsquo;re running <code>pnpm dev</code> without a reachable backend.
            </p>
            <p className="text-sm text-muted-foreground">Two ways to fix:</p>
            <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-2 ml-2">
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
            <p className="text-sm text-muted-foreground">
              The terminal running <code>pnpm dev</code> has more detail, plus a link to{" "}
              <code>docs/getting-started/installation.md</code>.
            </p>
          </div>
        ) : (
          <div className="space-y-2 border border-border rounded-md p-4 bg-muted/30">
            <p className="text-sm text-foreground">
              Couldn&rsquo;t load the configuration this UI needs to start. This is usually a
              backend-side issue — please contact your administrator.
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={onRetry}>Retry</Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Reload page
          </Button>
        </div>
      </div>
    </div>
  );
}
