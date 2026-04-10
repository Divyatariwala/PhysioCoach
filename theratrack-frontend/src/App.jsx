import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import BaseLayout from "./components/layout/baseLayout";
import AuthLayout from "./components/layout/AuthLayout";
import { AuthProvider } from "./components/layout/AuthContext";
import Home from "./components/pages/Home";
import About from "./components/pages/About";
import Contact from "./components/pages/Contact";
import Exercises from "./components/pages/Exercises";
import Profile from "./components/pages/Profile";
import Login from "./components/pages/Login";
import Register from "./components/pages/Register";
import PrivacyPolicy from "./components/pages/PrivacyPolicy";
import PrivateRoute from "./components/auth/PrivateRoute";
import CookiesBanner from "./components/layout/CookiesBanner";
import ChatbotPopup from "./components/pages/ChatbotPopup";


function App() {
  return (
    <Router>
      <AuthProvider>
        {/* Shows cookies popup across all pages */}
        <CookiesBanner />

        <Routes>
          {/* AUTH ROUTES (NO NAVBAR / FOOTER) */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* MAIN APP ROUTES */}
          <Route path="/" element={<BaseLayout />}>
            <Route index element={<Home />} />
            <Route path="home" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />

            {/* Protected Routes */}
            <Route element={<PrivateRoute />}>
              <Route path="/profile" element={<Profile />} />
              <Route path="/exercises" element={<Exercises />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
