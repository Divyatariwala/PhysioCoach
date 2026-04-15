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

  const currentTime = Date.now() / 1000;

  // only expire AFTER real expiry
  return payload.exp < currentTime;
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

  // ------------------ Max session duration (5 days) ------------------
 useEffect(() => {
  if (!auth.token) return;

  const FIVE_DAYS = 5 * 24 * 60 * 60 * 1000;

  const checkSession = () => {
    const sessionStart = Number(localStorage.getItem("session_start"));

    // if missing → create it (DON’T logout user)
    if (!sessionStart) {
      localStorage.setItem("session_start", Date.now().toString());
      return;
    }

    // expire only after 5 days
    if (Date.now() - sessionStart > FIVE_DAYS) {
      logout();
    }
  };

  checkSession(); // run once immediately

  const interval = setInterval(checkSession, 60 * 1000); // check every 1 min

  return () => clearInterval(interval);
}, [auth.token, logout]);

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