import React from "react";

import { useI18n } from "@oc-mui/i18n";
import { useAuth, useAuthActions } from "@oc-mui/router";
import { Button } from "@oc-mui/ui/components";

export const LoginButton = () => {
  const { t } = useI18n();
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
      {isAuthenticated ? t("auth.logOut") : t("auth.logIn")}
    </Button>
  );
};
