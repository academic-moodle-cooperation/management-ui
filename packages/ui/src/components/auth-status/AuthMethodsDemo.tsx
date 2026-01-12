import React from "react";
import { useAuth, useAuthActions } from "@workspace/router";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";

/**
 * AuthMethodsDemo component that demonstrates the standardized authentication approach.
 * All authentication now uses the /login and /logout routes consistently.
 *
 * The useAuthActions hook now uses these routes internally for consistency.
 */
export const AuthMethodsDemo: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { login, logout, isLoading: authActionsLoading } = useAuthActions();

  // Method 1: Using useAuthActions hook (now uses standardized routes internally)
  const handleHookLogin = () => {
    login(); // Now routes through /login internally
  };

  const handleHookLogout = () => {
    logout(); // Now routes through /logout internally
  };

  // Method 2: Direct route navigation (same result as Method 1)
  const handleDirectRouteLogin = () => {
    window.location.href = "/login";
  };

  const handleDirectRouteLogout = () => {
    window.location.href = "/logout";
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Authentication Methods Demo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-2">
          <span>Status:</span>
          <Badge variant={isAuthenticated ? "default" : "secondary"}>
            {isAuthenticated ? "Authenticated" : "Not Authenticated"}
          </Badge>
        </div>

        {isAuthenticated && user?.currentUser && (
          <div className="space-y-1 text-sm">
            <div>
              <strong>User:</strong> {user.currentUser.name}
            </div>
            <div>
              <strong>Role:</strong> {user.currentUser.userRole}
            </div>
          </div>
        )}

        <Separator />

        {/* Method 1: useAuthActions Hook */}
        <div className="space-y-3">
          <h4 className="font-medium">Method 1: useAuthActions Hook</h4>
          <p className="text-sm text-muted-foreground">
            Uses useAuthActions hook (now internally routes through /login and /logout)
          </p>
          <div className="flex gap-2">
            {isAuthenticated ? (
              <Button
                onClick={handleHookLogout}
                variant="outline"
                disabled={authActionsLoading}
                size="sm"
              >
                {authActionsLoading ? "Loading..." : "Hook Logout"}
              </Button>
            ) : (
              <Button onClick={handleHookLogin} disabled={authActionsLoading} size="sm">
                {authActionsLoading ? "Loading..." : "Hook Login"}
              </Button>
            )}
          </div>
        </div>

        <Separator />

        {/* Method 2: Direct Route Navigation */}
        <div className="space-y-3">
          <h4 className="font-medium">Method 2: Direct Route Navigation</h4>
          <p className="text-sm text-muted-foreground">
            Direct navigation to /login and /logout routes (same result as Method 1)
          </p>
          <div className="flex gap-2">
            {isAuthenticated ? (
              <Button onClick={handleDirectRouteLogout} variant="outline" size="sm">
                Route Logout
              </Button>
            ) : (
              <Button onClick={handleDirectRouteLogin} size="sm">
                Route Login
              </Button>
            )}
          </div>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            <strong>Note:</strong> Both methods now use the same standardized routes internally
          </p>
          <p>
            <strong>Benefit:</strong> Consistent behavior, centralized auth logic, proper redirect
            handling
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
