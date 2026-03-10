import React, { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../layout/AuthContext";

export default function PrivateRoute() {
  const { token } = useContext(AuthContext);

  // If not logged in, redirect to login page
  if (!token) {
    return <Navigate to="/api/login" replace />;
  }

  // If logged in, render the protected component(s)
  return <Outlet />;
}