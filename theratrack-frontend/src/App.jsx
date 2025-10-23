import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import BaseLayout from "./components/layout/baseLayout";
import Home from "./components/pages/Home";
import About from "./components/pages/About";
import Contact from "./components/pages/Contact";
import Exercises from "./components/pages/Exercises";
import Profile from "./components/pages/Profile";
import Login from "./components/pages/Login";
import Register from "./components/pages/Register";
import ForgotPassword from "./components/pages/ForgotPassword";
import PrivateRoute from "./components/auth/PrivateRoute"; // 👈 Import

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<BaseLayout />}>
          <Route index element={<Home />} />
          <Route path="home" element={<Home />} />
          <Route path="api/about" element={<About />} />
          <Route path="api/contact" element={<Contact />} />
          <Route path="api/faq" element={<div>FAQ Page</div>} />

          {/* 🔐 Protected routes go here */}
          <Route element={<PrivateRoute />}>
            <Route path="api/profile" element={<Profile />} />
            <Route path="api/exercises" element={<Exercises />} />
          </Route>

          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgotpassword" element={<ForgotPassword />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
