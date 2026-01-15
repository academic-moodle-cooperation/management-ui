import { redirect } from "@tanstack/react-router";
import { describe, it, expect, vi } from "vitest";

import { authGuard, protectionMetadata, isProtectedRoute, getRouteProtection } from "./routeGuards";

// Mock @tanstack/react-router
vi.mock("@tanstack/react-router", () => ({
  redirect: vi.fn((options: { to: string }) => {
    const error = new Error(`Redirect to ${options.to}`);
    (error as Error & { to?: string }).to = options.to;
    throw error;
  }),
}));

// Type for test context
interface TestRouteContext {
  context: {
    auth?: {
      isAuthenticated: boolean;
      user: {
        currentUser?: {
          userRole?: string;
        };
      } | null;
    };
  };
}

describe("routeGuards", () => {
  describe("authGuard", () => {
    it("should redirect if authentication is required but user is not authenticated", async () => {
      const guard = authGuard({ requireAuth: true, redirectTo: "/login" });
      const context = {
        context: {
          auth: {
            isAuthenticated: false,
            user: null,
          },
        },
      };

      await expect(() => guard(context as TestRouteContext)).rejects.toThrow("Redirect to /login");
      expect(redirect).toHaveBeenCalledWith({ to: "/login" });
    });

    it("should not redirect if authentication is not required", async () => {
      const guard = authGuard({ requireAuth: false });
      const context = {
        context: {
          auth: {
            isAuthenticated: false,
            user: null,
          },
        },
      };

      await expect(guard(context as TestRouteContext)).resolves.not.toThrow();
    });

    it("should allow access if user is authenticated", async () => {
      const guard = authGuard({ requireAuth: true });
      const context = {
        context: {
          auth: {
            isAuthenticated: true,
            user: {
              currentUser: {
                userRole: "ROLE_USER",
              },
            },
          },
        },
      };

      await expect(guard(context as TestRouteContext)).resolves.not.toThrow();
    });

    it("should redirect if user doesn't have required role", async () => {
      const guard = authGuard({
        requireAuth: true,
        requiredRoles: ["ROLE_ADMIN"],
        redirectTo: "/access-denied",
      });
      const context = {
        context: {
          auth: {
            isAuthenticated: true,
            user: {
              currentUser: {
                userRole: "ROLE_USER",
              },
            },
          },
        },
      };

      await expect(() => guard(context as TestRouteContext)).rejects.toThrow(
        "Redirect to /access-denied",
      );
    });

    it("should allow access if user has required role", async () => {
      const guard = authGuard({
        requireAuth: true,
        requiredRoles: ["ROLE_ADMIN"],
      });
      const context = {
        context: {
          auth: {
            isAuthenticated: true,
            user: {
              currentUser: {
                userRole: "ROLE_ADMIN",
              },
            },
          },
        },
      };

      await expect(guard(context as TestRouteContext)).resolves.not.toThrow();
    });
  });

  describe("protectionMetadata", () => {
    it("should create protection metadata", () => {
      const metadata = protectionMetadata({
        requireAuth: true,
        roles: ["ROLE_ADMIN"],
        description: "Admin only",
      });

      expect(metadata).toEqual({
        protected: true,
        requireAuth: true,
        requiredRoles: ["ROLE_ADMIN"],
        protectionDescription: "Admin only",
      });
    });

    it("should use defaults when options are not provided", () => {
      const metadata = protectionMetadata({});

      expect(metadata).toEqual({
        protected: true,
        requireAuth: true,
        requiredRoles: [],
        protectionDescription: undefined,
      });
    });
  });

  describe("isProtectedRoute", () => {
    it("should return true for protected route", () => {
      const route = {
        staticData: {
          protected: true,
        },
      };

      expect(isProtectedRoute(route)).toBe(true);
    });

    it("should return false for unprotected route", () => {
      const route = {
        staticData: {
          protected: false,
        },
      };

      expect(isProtectedRoute(route)).toBe(false);
    });

    it("should return false if staticData is missing", () => {
      const route = {};

      expect(isProtectedRoute(route)).toBe(false);
    });
  });

  describe("getRouteProtection", () => {
    it("should return protection requirements for protected route", () => {
      const route = {
        staticData: {
          protected: true,
          requireAuth: true,
          requiredRoles: ["ROLE_ADMIN"],
          protectionDescription: "Admin only",
        },
      };

      const protection = getRouteProtection(route);

      expect(protection).toEqual({
        requireAuth: true,
        requiredRoles: ["ROLE_ADMIN"],
        description: "Admin only",
      });
    });

    it("should return null for unprotected route", () => {
      const route = {
        staticData: {
          protected: false,
        },
      };

      expect(getRouteProtection(route)).toBeNull();
    });

    it("should use defaults when values are missing", () => {
      const route = {
        staticData: {
          protected: true,
        },
      };

      const protection = getRouteProtection(route);

      expect(protection).toEqual({
        requireAuth: true,
        requiredRoles: [],
        description: undefined,
      });
    });
  });
});
