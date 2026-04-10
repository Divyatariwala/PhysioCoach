import React, { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [auth, setAuth] = useState(() => ({
    token: localStorage.getItem("access_token"),
    role: localStorage.getItem("userRole") || "user"
  }));

  // ------------------ Decode JWT safely ------------------
  const decodeToken = (token) => {
    try {
      return JSON.parse(atob(token.split(".")[1]));
    } catch {
      return null;
    }
  };

  // ------------------ Check token expiry ------------------
  const isTokenExpired = (token) => {
    if (!token) return true;

    const payload = decodeToken(token);
    if (!payload?.exp) return true;

    return payload.exp < Date.now() / 1000;
  };

  // ------------------ Login ------------------
  const login = ({ token, role }) => {
    const authData = { token, role };

    setAuth(authData);
    localStorage.setItem("access_token", token);
    localStorage.setItem("userRole", role);
    localStorage.setItem("session_start", Date.now());

    navigate("/"); // redirect after login
  };

  // ------------------ Logout ------------------
  const logout = (redirect = true) => {
    setAuth({ token: null, role: "user" });

    localStorage.removeItem("access_token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("session_start");

    if (redirect && window.location.pathname !== "/login") {
      navigate("/login");
    }
  };

  // ------------------ Validate on token change ------------------
  useEffect(() => {
    if (auth.token && isTokenExpired(auth.token)) {
      logout(false);
    }
  }, [auth.token]);

  // ------------------ Periodic expiry check ------------------
  useEffect(() => {
    if (!auth.token) return;

    const interval = setInterval(() => {
      if (isTokenExpired(auth.token)) {
        logout();
      }
    }, 5 * 60 * 1000); // every 5 mins

    return () => clearInterval(interval);
  }, [auth.token]);

  // ------------------ Max session duration (5 days) ------------------
  useEffect(() => {
    const FIVE_DAYS = 5 * 24 * 60 * 60 * 1000;

    const sessionStart = Number(localStorage.getItem("session_start"));

    if (!sessionStart) {
      localStorage.setItem("session_start", Date.now());
    } else if (Date.now() - sessionStart > FIVE_DAYS) {
      logout();
    }
  }, []);

  const isLoggedIn = !!auth.token;

  return (
    <AuthContext.Provider
      value={{
        token: auth.token,
        role: auth.role,
        isLoggedIn,
        login,
        logout,
        isTokenExpired
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};