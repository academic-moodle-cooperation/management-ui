import React from "react";

import { useGetCurrentUser, useAppConfig } from "@oc-mui/query";
import { useAuth } from "@oc-mui/router";

import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export const AuthDebug: React.FC = () => {
  const authContext = useAuth();
  const userQuery = useGetCurrentUser();
  const {
    config,
    isLoading: isConfigLoading,
    isError: isConfigError,
    error: configError,
  } = useAppConfig();

  // Analyze authentication logic
  const isAuthenticatedByLogic = authContext.user?.currentUser?.userRole !== "ROLE_USER_ANONYMOUS";

  // Determine main issue
  let primaryIssue = "None detected";
  let issueColor: "default" | "secondary" | "destructive" | "outline" = "default";

  if (isConfigError) {
    primaryIssue = "Config Error";
    issueColor = "destructive";
  } else if (userQuery.isError) {
    primaryIssue = "GraphQL Query Error";
    issueColor = "destructive";
  } else if (userQuery.isLoading) {
    primaryIssue = "Loading user data";
    issueColor = "secondary";
  } else if (authContext.isAuthenticated !== isAuthenticatedByLogic) {
    primaryIssue = "Auth logic mismatch";
    issueColor = "destructive";
  } else if (
    !authContext.isAuthenticated &&
    authContext.user?.currentUser?.userRole === "ROLE_USER_ANONYMOUS"
  ) {
    primaryIssue = "User is anonymous";
    issueColor = "outline";
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔍 Authentication Debug
            <Badge variant={issueColor}>{primaryIssue}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Config Status */}
          <div>
            <h4 className="font-medium mb-2">📋 Configuration Status</h4>
            <div className="space-y-1 text-sm">
              <div>
                Loading:{" "}
                <Badge variant={isConfigLoading ? "secondary" : "outline"}>
                  {String(isConfigLoading)}
                </Badge>
              </div>
              <div>
                Error:{" "}
                <Badge variant={isConfigError ? "destructive" : "outline"}>
                  {String(isConfigError)}
                </Badge>
              </div>
              {isConfigError && configError && (
                <div className="text-red-600">Error: {configError.message}</div>
              )}
              <div>
                GraphQL Endpoint:{" "}
                <code className="bg-gray-100 px-1 rounded">
                  {config?.api?.graphqlEndpoint || "undefined"}
                </code>
              </div>
              <div>
                Base URL:{" "}
                <code className="bg-gray-100 px-1 rounded">
                  {config?.api?.baseUrl || "undefined"}
                </code>
              </div>
              {typeof window !== "undefined" && (
                <div>
                  Window Origin:{" "}
                  <code className="bg-gray-100 px-1 rounded">{window.location.origin}</code>
                </div>
              )}
              {config?.api?.graphqlEndpoint?.startsWith("/") && typeof window !== "undefined" && (
                <div>
                  Resolved GraphQL URL:{" "}
                  <code className="bg-gray-100 px-1 rounded">
                    {window.location.origin + config.api.graphqlEndpoint}
                  </code>
                </div>
              )}
            </div>
          </div>

          {/* GraphQL Query Status */}
          <div>
            <h4 className="font-medium mb-2">🔄 GraphQL Query Status</h4>
            <div className="space-y-1 text-sm">
              <div>
                Loading:{" "}
                <Badge variant={userQuery.isLoading ? "secondary" : "outline"}>
                  {String(userQuery.isLoading)}
                </Badge>
              </div>
              <div>
                Error:{" "}
                <Badge variant={userQuery.isError ? "destructive" : "outline"}>
                  {String(userQuery.isError)}
                </Badge>
              </div>
              <div>
                Success:{" "}
                <Badge variant={userQuery.isSuccess ? "default" : "outline"}>
                  {String(userQuery.isSuccess)}
                </Badge>
              </div>
              <div>
                Enabled:{" "}
                <Badge variant={userQuery.isPlaceholderData ? "secondary" : "default"}>
                  {String(!userQuery.isPlaceholderData)}
                </Badge>
              </div>
              {userQuery.error && (
                <div className="text-red-600">Error: {userQuery.error.message}</div>
              )}
            </div>
          </div>

          {/* Auth Context Status */}
          <div>
            <h4 className="font-medium mb-2">🔐 Auth Context Status</h4>
            <div className="space-y-1 text-sm">
              <div>
                Is Authenticated:{" "}
                <Badge variant={authContext.isAuthenticated ? "default" : "outline"}>
                  {String(authContext.isAuthenticated)}
                </Badge>
              </div>
              <div>
                User Role:{" "}
                <code className="bg-gray-100 px-1 rounded">
                  {authContext.user?.currentUser?.userRole || "undefined"}
                </code>
              </div>
              <div>
                Username:{" "}
                <code className="bg-gray-100 px-1 rounded">
                  {authContext.user?.currentUser?.username || "undefined"}
                </code>
              </div>
              <div>
                Email:{" "}
                <code className="bg-gray-100 px-1 rounded">
                  {authContext.user?.currentUser?.email || "undefined"}
                </code>
              </div>
            </div>
          </div>

          {/* Raw Data */}
          <div>
            <h4 className="font-medium mb-2">📊 Raw Data</h4>
            <div className="space-y-2 text-xs">
              <div>
                <strong>User Query Data:</strong>
                <pre className="bg-gray-50 p-2 rounded mt-1 overflow-auto max-h-32">
                  {JSON.stringify(userQuery.data, null, 2)}
                </pre>
              </div>
              <div>
                <strong>Auth Context User:</strong>
                <pre className="bg-gray-50 p-2 rounded mt-1 overflow-auto max-h-32">
                  {JSON.stringify(authContext.user, null, 2)}
                </pre>
              </div>
            </div>
          </div>

          {/* Troubleshooting Tips */}
          <div>
            <h4 className="font-medium mb-2">💡 Troubleshooting Tips</h4>
            <div className="space-y-2 text-sm">
              {isConfigError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  Config loading failed. Check if the config endpoint is accessible and returns
                  valid JSON.
                </div>
              )}

              {userQuery.isError && userQuery.error?.message.includes("Invalid URL") && (
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  GraphQL client URL construction failed. Check the console for detailed URL
                  debugging info.
                </div>
              )}

              {userQuery.isError && userQuery.error?.message.includes("NetworkError") && (
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  Network error accessing GraphQL endpoint. Check if the endpoint is accessible and
                  CORS is configured.
                </div>
              )}

              {!userQuery.isError &&
                userQuery.data &&
                authContext.user?.currentUser?.userRole === "ROLE_USER_ANONYMOUS" && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                    User data loaded but shows anonymous role. This means you&apos;re not logged in
                    or your session expired.
                  </div>
                )}

              {!userQuery.isError &&
                !isConfigError &&
                !userQuery.isLoading &&
                authContext.isAuthenticated !== isAuthenticatedByLogic && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded">
                    Auth context state doesn&apos;t match user role logic. There may be a sync issue
                    in AuthInitializer.
                  </div>
                )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
