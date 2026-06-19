/**
 * LoginForm
 *
 * Shell-native login form rendered by the `/login` route (wired in
 * `commonRoutes.tsx`) for Opencast's Spring Security password backend.
 * Injected into `@oc-mui/router`'s `createLoginRoute` via its
 * `formComponent` option — the router package can't import `@oc-mui/ui`
 * directly (that would form a dependency cycle), so the form lives here
 * in the shell where both `@oc-mui/ui` and `@oc-mui/query` are available.
 *
 * Why a native form instead of redirecting to Opencast's `/login.html`:
 * the backend's `AuthenticationSuccessHandler` only returns you to your
 * original location if Spring's entry point captured it in the session
 * (`INITIAL_REQUEST_PATH`) — which never happens for the dev shell since
 * Vite serves it on a different origin than the backend. Redirecting to
 * the backend login therefore dumps you on the role-based welcome page
 * (the Opencast admin) after login, not back in the management UI.
 *
 * By POSTing the credentials ourselves to `/j_spring_security_check`
 * (proxied → same origin → session cookie lands on the dev origin) and
 * then navigating to the originally-requested path, we own the
 * post-login destination entirely. Sending `Accept: application/json`
 * makes the success handler reply with a redirect to `/info/me.json`
 * rather than the welcome page, so the POST resolves cleanly; we then
 * confirm the result via the canonical `currentUser` query.
 */
import { useState, type FormEvent } from "react";

import { useTranslation } from "@oc-mui/i18n";
import { useGetCurrentUser } from "@oc-mui/query";
import type { LoginFormComponentProps } from "@oc-mui/router";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  Label,
} from "@oc-mui/ui/components";

/** Spring Security form-login processing endpoint (proxied in dev). */
const SPRING_SECURITY_CHECK_URL = "/j_spring_security_check";

/**
 * Only allow same-origin relative redirects (must start with a single
 * `/`). Anything else — absolute URLs, protocol-relative `//evil.com` —
 * is rejected in favour of the app base, to avoid an open-redirect.
 */
const safeRedirect = (redirect: string): string => {
  const base = import.meta.env.BASE_URL || "/";
  if (redirect.startsWith("/") && !redirect.startsWith("//")) {
    return redirect;
  }
  return base;
};

export function LoginForm({ redirect }: LoginFormComponentProps) {
  const { t } = useTranslation();
  const { refetch } = useGetCurrentUser();

  // On localhost dev, prefill the stock Opencast test credentials —
  // mirrors the convenience in Opencast's own login.js.
  const isLocalDev =
    import.meta.env.DEV &&
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

  const [username, setUsername] = useState(isLocalDev ? "admin" : "");
  const [password, setPassword] = useState(isLocalDev ? "opencast" : "");
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const body = new URLSearchParams();
    body.set("j_username", username);
    body.set("j_password", password);
    if (rememberMe) {
      body.set("_spring_security_remember_me", "on");
    }

    try {
      await fetch(SPRING_SECURITY_CHECK_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
        credentials: "include",
      });

      // The POST itself returns a redirect regardless of outcome, so the
      // authoritative success signal is the user query: did we come back
      // as a real (non-anonymous) user?
      const { data } = await refetch();
      const role = data?.currentUser?.userRole;

      if (role && role !== "ROLE_USER_ANONYMOUS") {
        // Full-page navigation guarantees a clean, freshly-authenticated
        // shell boot at the destination.
        window.location.assign(safeRedirect(redirect));
        return;
      }

      setError(t("auth.errorInvalidCredentials"));
    } catch {
      setError(t("auth.errorServerUnreachable"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-svh w-full flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-heading">{t("auth.signIn")}</CardTitle>
          <CardDescription>{t("auth.signInDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">{t("auth.username")}</Label>
              <Input
                id="username"
                name="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={submitting}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
                disabled={submitting}
              />
              <Label htmlFor="remember" className="font-normal">
                {t("auth.rememberMe")}
              </Label>
            </div>

            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? t("auth.signingIn") : t("auth.signIn")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
