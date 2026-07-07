/**
 * Simple protection contract consumed by `AppProtection`.
 *
 * Lives here so the protection primitive and its shape travel together and
 * plugins can import the type from `@oc-mui/router` without reaching into
 * `@oc-mui/ui-config`.
 */
export interface AppProtectionConfig {
  /**
   * When true, the app is publicly accessible. When false or omitted the app
   * requires authentication.
   */
  public?: boolean;
  /**
   * Roles allowed to access the app. When set (non-empty), an authenticated
   * user is granted access only if they hold one of these roles (matched
   * against the granted `roles` from `/info/me.json`); everyone else gets an
   * access-denied screen. Omit to allow any authenticated user. Overrides the
   * app's own `requiredRoles` declaration, so a deployment can widen or restrict
   * access (e.g. a non-default admin role) without a code change.
   */
  requiredRoles?: string[];
}
