import React, { createContext, useContext, useState } from "react";

import type { MuiUserQuery } from "@opencast-mui/query";

export interface AuthContextType {
  isAuthenticated: boolean;
  setUser: (user: MuiUserQuery | undefined) => void;
  user: MuiUserQuery | undefined;

  // login: () => void;
  // logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  setUser: () => {},
  user: undefined,
  // login: () => { },
  // logout: () => { },
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<MuiUserQuery | undefined>(undefined);
  // Derive authentication directly from user data to avoid one-render lag
  // (setState/useEffect timing can briefly report false after user becomes authenticated).
  const isAuthenticated = Boolean(user && user.currentUser.userRole !== "ROLE_USER_ANONYMOUS");

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
