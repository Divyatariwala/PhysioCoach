import { createContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  // ------------------ Initial auth state ------------------
  const [auth, setAuth] = useState(() => ({
    token: localStorage.getItem("access_token"),
    role: localStorage.getItem("userRole") || "user",
  }));

  // ------------------ Decode JWT ------------------
  const decodeToken = (token) => {
    try {
      return JSON.parse(atob(token.split(".")[1]));
    } catch (err) {
      return null;
    }
  };

  // ------------------ Check expiry safely ------------------
  const isTokenExpired = useCallback((token) => {
    if (!token) return true;

    const payload = decodeToken(token);
    if (!payload?.exp) return true;

    // buffer = prevents instant logout due to timing mismatch
    const bufferInSeconds = 30;
    const currentTime = Date.now() / 1000;

    return payload.exp < currentTime + bufferInSeconds;
  }, []);

  // ------------------ Login ------------------
  const login = ({ token, role }) => {
    setAuth({ token, role });

    localStorage.setItem("access_token", token);
    localStorage.setItem("userRole", role);
    localStorage.setItem("session_start", Date.now().toString());

    navigate("/");
  };

  // ------------------ Logout ------------------
  const logout = useCallback((redirect = true) => {
    setAuth({ token: null, role: "user" });

    localStorage.removeItem("access_token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("session_start");

    if (redirect && window.location.pathname !== "/") {
      navigate("/", {replace:true});
    }
  }, [navigate]);

  // ------------------ Validate on token change ------------------
  useEffect(() => {
    if (auth.token && isTokenExpired(auth.token)) {
      logout(false);
    }
  }, [auth.token, isTokenExpired, logout]);

  // ------------------ Periodic token check ------------------
  useEffect(() => {
    if (!auth.token) return;

    const interval = setInterval(() => {
      if (isTokenExpired(auth.token)) {
        logout();
      }
    }, 60 * 1000); // check every 1 minute

    return () => clearInterval(interval);
  }, [auth.token, isTokenExpired, logout]);

  // ------------------ Max session duration (5 days) ------------------
  useEffect(() => {
    const FIVE_DAYS = 5 * 24 * 60 * 60 * 1000;

    const sessionStart = Number(localStorage.getItem("session_start"));

    if (!sessionStart) {
      localStorage.setItem("session_start", Date.now().toString());
    } else if (Date.now() - sessionStart > FIVE_DAYS) {
      logout();
    }
  }, [logout]);

  // ------------------ Derived state ------------------
  const isLoggedIn = !!auth.token;

  return (
    <AuthContext.Provider
      value={{
        token: auth.token,
        role: auth.role,
        isLoggedIn,
        login,
        logout,
        isTokenExpired,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 