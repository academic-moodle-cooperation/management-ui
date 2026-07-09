import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAppConfig, useGetCurrentUser, useGetUserInfo } from "@oc-mui/query";

import { useAuth } from "../auth/AuthContext";

import { AppProtection } from "./AppProtection";

import type React from "react";

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

  it("renders the injected accessDeniedComponent when a role is missing", () => {
    setUser(["ROLE_USER"]);
    const AccessDenied = ({ requiredRoles }: { requiredRoles: string[]; userRoles: string[] }) => (
      <div>denied:{requiredRoles.join(",")}</div>
    );
    render(
      <AppProtection
        appName="marketplace-plugins"
        requiredRoles={["ROLE_ADMIN"]}
        accessDeniedComponent={AccessDenied}
      >
        {child}
      </AppProtection>,
    );
    expect(screen.queryByText("denied:ROLE_ADMIN")).not.toBeNull();
    expect(screen.queryByText("secret content")).toBeNull();
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

/**
 * The non-role branches: public bypass, the loading/redirecting/error states,
 * and the anonymous → /login redirect.
 */
describe("AppProtection auth states", () => {
  const child = <div>secret content</div>;

  beforeEach(() => {
    vi.mocked(useAppConfig).mockReturnValue({ config: { plugins: {} } } as never);
    vi.mocked(useGetUserInfo).mockReturnValue({ data: undefined, isPending: false } as never);
    vi.mocked(useGetCurrentUser).mockReturnValue({
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as never);
    // Default: auth still resolving (no user yet).
    vi.mocked(useAuth).mockReturnValue({ user: undefined, isAuthenticated: false } as never);
  });

  afterEach(() => vi.clearAllMocks());

  it("renders a public app without requiring authentication", () => {
    vi.mocked(useAppConfig).mockReturnValue({
      config: { plugins: { pub: { protection: { public: true } } } },
    } as never);
    render(<AppProtection appName="pub">{child}</AppProtection>);
    expect(screen.queryByText("secret content")).not.toBeNull();
  });

  it("shows the checking state while auth is still resolving", () => {
    render(<AppProtection appName="x">{child}</AppProtection>);
    expect(screen.queryByText(/checking authentication/i)).not.toBeNull();
    expect(screen.queryByText("secret content")).toBeNull();
  });

  it("uses the injected loadingComponent while auth is resolving", () => {
    const Loader = ({ children }: { children?: React.ReactNode }) => (
      <div>branded-loader{children}</div>
    );
    render(
      <AppProtection appName="x" loadingComponent={Loader}>
        {child}
      </AppProtection>,
    );
    expect(screen.queryByText(/branded-loader/)).not.toBeNull();
  });

  it("shows an inline error + retry on a non-auth backend failure", () => {
    const refetch = vi.fn();
    vi.mocked(useGetCurrentUser).mockReturnValue({
      isError: true,
      error: new Error("Request failed with status code 500"),
      refetch,
    } as never);
    render(<AppProtection appName="x">{child}</AppProtection>);
    expect(screen.queryByText("secret content")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("uses the injected errorComponent on a non-auth backend failure", () => {
    const refetch = vi.fn();
    vi.mocked(useGetCurrentUser).mockReturnValue({
      isError: true,
      error: new Error("ECONNREFUSED"),
      refetch,
    } as never);
    const ErrorScreen = ({ onRetry }: { error: unknown; onRetry: () => void }) => (
      <button onClick={onRetry}>custom-retry</button>
    );
    render(
      <AppProtection appName="x" errorComponent={ErrorScreen}>
        {child}
      </AppProtection>,
    );
    fireEvent.click(screen.getByRole("button", { name: /custom-retry/i }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("does NOT show the error screen for a 401 (falls through to login)", () => {
    // A 401 is an auth error, so the error branch is skipped; with no user
    // resolved it shows the checking state rather than the outage screen.
    vi.mocked(useGetCurrentUser).mockReturnValue({
      isError: true,
      error: new Error("Request failed with status code 401"),
      refetch: vi.fn(),
    } as never);
    render(<AppProtection appName="x">{child}</AppProtection>);
    expect(screen.queryByText(/couldn.t verify your session/i)).toBeNull();
    expect(screen.queryByText(/checking authentication/i)).not.toBeNull();
  });

  describe("anonymous redirect", () => {
    let originalLocation: Location;
    let hrefSpy: ReturnType<typeof vi.fn<(value: string) => void>>;

    beforeEach(() => {
      originalLocation = window.location;
      hrefSpy = vi.fn<(value: string) => void>();
      Object.defineProperty(window, "location", {
        configurable: true,
        value: {
          pathname: "/management-ui/episodes",
          search: "?page=2",
          get href() {
            return "";
          },
          set href(value: string) {
            hrefSpy(value);
          },
        },
      });
      vi.mocked(useAuth).mockReturnValue({
        user: { currentUser: { userRole: "ROLE_USER_ANONYMOUS" } },
        isAuthenticated: false,
      } as never);
    });

    afterEach(() => {
      Object.defineProperty(window, "location", {
        configurable: true,
        value: originalLocation,
      });
    });

    it("redirects an anonymous user to /login, preserving the target path", () => {
      render(<AppProtection appName="x">{child}</AppProtection>);
      expect(screen.queryByText(/redirecting to login/i)).not.toBeNull();
      expect(screen.queryByText("secret content")).toBeNull();
      expect(hrefSpy).toHaveBeenCalledTimes(1);
      const target = hrefSpy.mock.calls[0]![0];
      expect(target).toContain("/login?redirect=");
      expect(target).toContain(encodeURIComponent("/management-ui/episodes?page=2"));
    });

    it("renders the injected redirectingComponent while navigating", () => {
      render(
        <AppProtection appName="x" redirectingComponent={<div>going-to-login</div>}>
          {child}
        </AppProtection>,
      );
      expect(screen.queryByText("going-to-login")).not.toBeNull();
    });
  });
});
