import React from "react";

import { useAuth, useAuthActions } from "@oc-mui/router";
import { Button } from "@oc-mui/ui/components";

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
