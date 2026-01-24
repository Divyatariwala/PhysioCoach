// File: src/components/auth/PrivateRoute.js
import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const PrivateRoute = () => {
  // Example: check login status from localStorage, context, or state
  const token = localStorage.getItem("isLoggedIn");
  const isLoggedIn = !!token; // true if token exists

  // If not logged in, redirect to login
  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  // If logged in, render child routes
  return <Outlet />;
};

export default PrivateRoute;
