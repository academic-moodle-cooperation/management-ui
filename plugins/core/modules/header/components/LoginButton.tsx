import React from "react";

import { useAuth, useAuthActions } from "@opencast-mui/router";
import { Button } from "@opencast-mui/ui/components";

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
