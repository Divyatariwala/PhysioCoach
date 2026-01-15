import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import BaseLayout from "./components/layout/baseLayout";
import AuthLayout from "./components/layout/AuthLayout";
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
      {/* Shows cookies popup across all pages */}
      <CookiesBanner />

      <Routes>
        {/* AUTH ROUTES (NO NAVBAR / FOOTER) */}
        <Route element={<AuthLayout />}>
          <Route path="api/login" element={<Login />} />
          <Route path="api/register" element={<Register />} />
        </Route>

        {/* MAIN APP ROUTES */}
        <Route path="/" element={<BaseLayout />}>
          <Route index element={<Home />} />
          <Route path="home" element={<Home />} />
          <Route path="api/about" element={<About />} />
          <Route path="api/contact" element={<Contact />} />
          <Route path="api/faq" element={<div>FAQ Page</div>} />
          <Route path="api/privacy" element={<PrivacyPolicy />} />

          {/* Protected Routes */}
          <Route element={<PrivateRoute />}>
            <Route path="api/profile" element={<Profile />} />
            <Route path="api/exercises" element={<Exercises />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
