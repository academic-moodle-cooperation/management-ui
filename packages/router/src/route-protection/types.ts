/**
 * Simple protection contract consumed by `AppProtection`.
 *
 * Lives here so the protection primitive and its shape travel together and
 * plugins can import the type from `@workspace/router` without reaching into
 * `@workspace/ui-config`.
 */
export interface AppProtectionConfig {
  /**
   * When true, the app is publicly accessible. When false or omitted the app
   * requires authentication.
   */
  public?: boolean;
}
