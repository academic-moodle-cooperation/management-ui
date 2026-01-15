import { Navigate } from "@tanstack/react-router";
import React from "react";

import { useAuth } from "../auth/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  loadingComponent?: React.ComponentType<{ children?: React.ReactNode }>;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  loadingComponent: LoadingComponent,
}) => {
  const { user } = useAuth();

  // Check authentication directly from user data (avoid timing issues with derived state)
  const userRole = user?.currentUser?.userRole;
  const isUserAuthenticated = Boolean(user && userRole !== "ROLE_USER_ANONYMOUS");

  // Wait for auth state to be determined before making decisions
  // user === undefined means AuthInitializer is still loading auth data
  if (user === undefined) {
    if (LoadingComponent) {
      return (
        <LoadingComponent>
          <div className="p-8 text-center">
            <div className="text-gray-600">Checking authentication...</div>
          </div>
        </LoadingComponent>
      );
    }
    return (
      <div className="p-8 text-center">
        <div className="text-gray-600">Checking authentication...</div>
      </div>
    );
  }

  if (!isUserAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};
