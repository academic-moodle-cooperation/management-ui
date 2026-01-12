import React from "react";
import { useAuth, useAuthActions } from "@workspace/router";
import { Button } from "@workspace/ui/components";

export const LoginButton = () => {
  const { isAuthenticated } = useAuth();
  const { login, logout } = useAuthActions();

  const handleAuthAction = () => {
    if (isAuthenticated) {
      logout();
    } else {
      login();
    }
  };

  return (
    <Button type="button" onClick={handleAuthAction} variant="default" size="sm">
      {isAuthenticated ? "Logout" : "Login"}
    </Button>
  );
};
