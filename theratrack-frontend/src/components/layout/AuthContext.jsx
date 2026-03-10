import React, { createContext, useState } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

  const [auth, setAuth] = useState({
    token: localStorage.getItem("access_token"),
    role: localStorage.getItem("userRole") || "user"
  });

  const login = ({ token, role }) => {

    const authData = {
      token,
      role
    };

    // update React state immediately
    setAuth(authData);

    // store in localStorage
    localStorage.setItem("access_token", token);
    localStorage.setItem("userRole", role);
  };

  const logout = () => {

    setAuth({
      token: null,
      role: "user"
    });

    localStorage.removeItem("access_token");
    localStorage.removeItem("userRole");
  };

  const isLoggedIn = !!auth.token;

  return (
    <AuthContext.Provider
      value={{
        token: auth.token,
        role: auth.role,
        isLoggedIn,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};