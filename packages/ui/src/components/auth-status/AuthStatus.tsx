import React from "react";

import { useAuth, useAuthActions } from "@workspace/router";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

/**
 * AuthStatus component that displays current authentication status
 * and user information. This serves as an example of how to use
 * the authentication system in your components.
 */
export const AuthStatus: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { login, logout, isLoading: authActionsLoading } = useAuthActions();

  const handleLogin = () => {
    // Direct login using config URLs (bypasses /login route)
    login();
  };

  const handleLogout = () => {
    // Direct logout using config URLs (bypasses /logout route)
    logout();
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Authentication Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <span>Status:</span>
          <Badge variant={isAuthenticated ? "default" : "secondary"}>
            {isAuthenticated ? "Authenticated" : "Not Authenticated"}
          </Badge>
        </div>

        {isAuthenticated && user?.currentUser && (
          <div className="space-y-2">
            <div>
              <strong>Name:</strong> {user.currentUser.name}
            </div>
            <div>
              <strong>Email:</strong> {user.currentUser.email}
            </div>
            <div>
              <strong>Username:</strong> {user.currentUser.username}
            </div>
            <div>
              <strong>Role:</strong> {user.currentUser.userRole}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {isAuthenticated ? (
            <Button onClick={handleLogout} variant="outline" disabled={authActionsLoading}>
              {authActionsLoading ? "Loading..." : "Logout (Direct)"}
            </Button>
          ) : (
            <Button onClick={handleLogin} disabled={authActionsLoading}>
              {authActionsLoading ? "Loading..." : "Login (Direct)"}
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          {isAuthenticated ? (
            <p>This uses logout URL directly from app config</p>
          ) : (
            <p>This uses login URL directly from app config</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
