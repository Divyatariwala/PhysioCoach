import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const PrivateRoute = () => {
  const token = localStorage.getItem("access_token"); // check if logged in
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
