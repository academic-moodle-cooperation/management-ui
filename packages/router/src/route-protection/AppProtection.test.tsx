import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAppConfig, useGetCurrentUser, useGetUserInfo } from "@oc-mui/query";

import { useAuth } from "../auth/AuthContext";

import { AppProtection } from "./AppProtection";

vi.mock("@oc-mui/query", () => ({
  useAppConfig: vi.fn(),
  useGetCurrentUser: vi.fn(),
  useGetUserInfo: vi.fn(),
}));

vi.mock("../auth/AuthContext", () => ({
  useAuth: vi.fn(),
}));

/**
 * Regression coverage for the marketplace admin gate. The load-bearing detail:
 * authorization must be decided from the user's *granted* roles (the `roles`
 * array from /info/me.json), NOT from `currentUser.userRole`, which Opencast
 * derives as the per-user `ROLE_USER_<username>` identity role. Checking
 * `userRole` against `ROLE_ADMIN` would deny every admin; checking it against
 * `ROLE_USER_ADMIN` would only admit a user literally named "admin".
 */
describe("AppProtection role gate", () => {
  const child = <div>secret content</div>;

  const setUser = (roles: string[], userRole = "ROLE_USER_MMUSTER", orgAdminRole = "ROLE_ADMIN") => {
    vi.mocked(useAuth).mockReturnValue({
      user: { currentUser: { userRole } },
      isAuthenticated: true,
    } as never);
    vi.mocked(useGetUserInfo).mockReturnValue({
      data: { roles, org: { adminRole: orgAdminRole } },
      isPending: false,
    } as never);
  };

  beforeEach(() => {
    vi.mocked(useAppConfig).mockReturnValue({ config: { plugins: {} } } as never);
    vi.mocked(useGetCurrentUser).mockReturnValue({
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as never);
    // Default: an authenticated admin (username is deliberately NOT "admin" to
    // prove the gate keys off granted roles, not the identity role).
    setUser(["ROLE_ADMIN", "ROLE_USER"]);
  });

  afterEach(() => vi.clearAllMocks());

  it("renders the app for a user who holds the required role", () => {
    render(
      <AppProtection appName="marketplace-plugins" requiredRoles={["ROLE_ADMIN"]}>
        {child}
      </AppProtection>,
    );
    expect(screen.queryByText("secret content")).not.toBeNull();
  });

  it("admits an org admin whose role is renamed via org.adminRole (not literal ROLE_ADMIN)", () => {
    // Deployment renamed its admin role: the user holds ROLE_ORG_ADMIN, which
    // /info/me.json reports as org.adminRole. A ROLE_ADMIN-gated app must admit
    // them without a config override.
    setUser(["ROLE_ORG_ADMIN", "ROLE_USER"], "ROLE_USER_MMUSTER", "ROLE_ORG_ADMIN");
    render(
      <AppProtection appName="marketplace-plugins" requiredRoles={["ROLE_ADMIN"]}>
        {child}
      </AppProtection>,
    );
    expect(screen.queryByText("secret content")).not.toBeNull();
  });

  it("denies a user whose granted roles do not include the required role", () => {
    setUser(["ROLE_USER"]);
    render(
      <AppProtection appName="marketplace-plugins" requiredRoles={["ROLE_ADMIN"]}>
        {child}
      </AppProtection>,
    );
    expect(screen.queryByText("secret content")).toBeNull();
    expect(screen.queryByText(/don.t have permission/i)).not.toBeNull();
  });

  it("does NOT authorize off the per-user userRole identity role", () => {
    // Admin-named user, but WITHOUT ROLE_ADMIN granted → must be denied even
    // though their userRole is ROLE_USER_ADMIN.
    setUser(["ROLE_USER"], "ROLE_USER_ADMIN");
    render(
      <AppProtection appName="marketplace-plugins" requiredRoles={["ROLE_ADMIN"]}>
        {child}
      </AppProtection>,
    );
    expect(screen.queryByText("secret content")).toBeNull();
  });

  it("allows any authenticated user when no roles are required", () => {
    setUser(["ROLE_USER"]);
    render(
      <AppProtection appName="episodes">
        {child}
      </AppProtection>,
    );
    expect(screen.queryByText("secret content")).not.toBeNull();
  });

  it("shows a checking state (not denied) while granted roles are still loading", () => {
    vi.mocked(useGetUserInfo).mockReturnValue({ data: undefined, isPending: true } as never);
    render(
      <AppProtection appName="marketplace-plugins" requiredRoles={["ROLE_ADMIN"]}>
        {child}
      </AppProtection>,
    );
    expect(screen.queryByText("secret content")).toBeNull();
    expect(screen.queryByText(/don.t have permission/i)).toBeNull();
    expect(screen.queryByText(/checking permissions/i)).not.toBeNull();
  });

  it("lets a config override replace the app's declared roles", () => {
    vi.mocked(useAppConfig).mockReturnValue({
      config: { plugins: { "marketplace-plugins": { protection: { requiredRoles: ["ROLE_CUSTOM_ADMIN"] } } } },
    } as never);
    // User holds ROLE_ADMIN (the app default) but NOT the overridden role.
    setUser(["ROLE_ADMIN", "ROLE_USER"]);
    render(
      <AppProtection appName="marketplace-plugins" requiredRoles={["ROLE_ADMIN"]}>
        {child}
      </AppProtection>,
    );
    expect(screen.queryByText("secret content")).toBeNull();
  });
});
