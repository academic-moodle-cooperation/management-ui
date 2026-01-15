import React, { createContext, useContext, useEffect, useState } from "react";

import type { UserQuery } from "@workspace/query";

export interface AuthContextType {
  isAuthenticated: boolean;
  setUser: (user: UserQuery | undefined) => void;
  user: UserQuery | undefined;

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
  const [user, setUser] = useState<UserQuery | undefined>(undefined);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(Boolean(user && user.currentUser.userRole !== "ROLE_USER_ANONYMOUS"));
  }, [user]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
