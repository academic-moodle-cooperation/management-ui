import React from 'react';
import { useAuth, useAuthActions } from '@workspace/router';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';

/**
 * AuthMethodsDemo component that demonstrates both authentication methods:
 * 1. Direct config URLs (using useAuthActions)
 * 2. Route-based authentication (using /login and /logout routes)
 */
export const AuthMethodsDemo: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { login, logout, isLoading: authActionsLoading } = useAuthActions();

  // Method 1: Direct config URLs
  const handleDirectLogin = () => {
    login(); // Uses config URLs directly
  };

  const handleDirectLogout = () => {
    logout(); // Uses config URLs directly
  };

  // Method 2: Route-based (through /login and /logout routes)
  const handleRouteLogin = () => {
    window.location.href = '/login'; // Goes through route that redirects to config URL
  };

  const handleRouteLogout = () => {
    window.location.href = '/logout'; // Goes through route that redirects to config URL
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
            <div><strong>User:</strong> {user.currentUser.name}</div>
            <div><strong>Role:</strong> {user.currentUser.userRole}</div>
          </div>
        )}

        <Separator />

        {/* Method 1: Direct Config URLs */}
        <div className="space-y-3">
          <h4 className="font-medium">Method 1: Direct Config URLs</h4>
          <p className="text-sm text-muted-foreground">
            Uses useAuthActions hook to directly access login/logout URLs from app config
          </p>
          <div className="flex gap-2">
            {isAuthenticated ? (
              <Button
                onClick={handleDirectLogout}
                variant="outline"
                disabled={authActionsLoading}
                size="sm"
              >
                {authActionsLoading ? 'Loading...' : 'Direct Logout'}
              </Button>
            ) : (
              <Button
                onClick={handleDirectLogin}
                disabled={authActionsLoading}
                size="sm"
              >
                {authActionsLoading ? 'Loading...' : 'Direct Login'}
              </Button>
            )}
          </div>
        </div>

        <Separator />

        {/* Method 2: Route-based */}
        <div className="space-y-3">
          <h4 className="font-medium">Method 2: Route-based</h4>
          <p className="text-sm text-muted-foreground">
            Uses /login and /logout routes which then redirect to config URLs
          </p>
          <div className="flex gap-2">
            {isAuthenticated ? (
              <Button
                onClick={handleRouteLogout}
                variant="outline"
                size="sm"
              >
                Route Logout
              </Button>
            ) : (
              <Button
                onClick={handleRouteLogin}
                size="sm"
              >
                Route Login
              </Button>
            )}
          </div>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Direct method:</strong> Faster, fewer redirects</p>
          <p><strong>Route method:</strong> Consistent with TanStack Router patterns</p>
        </div>
      </CardContent>
    </Card>
  );
}; 