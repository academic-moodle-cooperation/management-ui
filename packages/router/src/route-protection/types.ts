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
}
