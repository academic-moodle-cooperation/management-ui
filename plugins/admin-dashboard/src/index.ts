import { LayoutDashboard } from "lucide-react";
import React from "react";

import { createPlugin } from "@workspace/plugin-system";
import { withAuthProtection } from "@workspace/router";
import { ForbiddenError } from "@workspace/ui/components";

import { AdminDashboard } from "./views/AdminDashboard";

const AdminAccessDenied: React.FC = () => {
  const handleBack = () => {
    if (typeof window !== "undefined") {
      window.history.back();
    }
  };

  const handleHome = () => {
    if (typeof window !== "undefined") {
      window.location.assign("/");
    }
  };

  return React.createElement(ForbiddenError, {
    onBackClick: handleBack,
    onHomeClick: handleHome,
  });
};

const ProtectedAdminDashboard = withAuthProtection(AdminDashboard, {
  requiredRoles: ["ROLE_ADMIN"],
  fallback: AdminAccessDenied,
});

export const adminDashboardPlugin = createPlugin({
  namespace: "admin",
  type: "dashboard",
  version: "1.0.0",

  initialize(manager) {
    console.log("Admin Dashboard plugin initializing...");

    manager.registerObject("apps:definitions", "admin-dashboard", {
      id: "admin-dashboard",
      name: "Admin Dashboard",
      routePath: "/admin/dashboard",
      component: ProtectedAdminDashboard,
    });

    manager.registerObject("sidebar:nav-items", "admin-dashboard", {
      title: "Admin Dashboard",
      path: "/admin/dashboard",
      icon: LayoutDashboard,
      order: 950,
      permissions: ["admin.view"],
      featureFlags: [],
      category: "admin",
    });

    console.log("Admin Dashboard plugin initialized");
  },

  activate() {
    console.log("Admin Dashboard plugin activated");
  },

  deactivate() {
    console.log("Admin Dashboard plugin deactivated");
  },
});

export default adminDashboardPlugin;

export { AdminDashboard };
