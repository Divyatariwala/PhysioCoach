import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "../../style.css";
import "../css/BaseLayout.css";

// Import Chatbot
import ChatbotPopup from "../pages/ChatbotPopup";

function BaseLayout() {
  const [showScroll, setShowScroll] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const location = useLocation();

  // Check login status on mount
  useEffect(() => {
    setIsLoggedIn(localStorage.getItem("isLoggedIn") === "true");

    // Listen for login changes from other tabs/windows
    const handleStorage = () => {
      setIsLoggedIn(localStorage.getItem("isLoggedIn") === "true");
    };
    window.addEventListener("storage", handleStorage);

    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("username");
    setIsLoggedIn(false);
    window.location.href = "/";
  };

  // Scroll button
  useEffect(() => {
    const handleScroll = () => setShowScroll(window.scrollY > 100);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Navbar links
  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/api/exercises", label: "Exercises", auth: true },
    { path: "/api/profile", label: "Profile", auth: true },
    { path: "/api/about", label: "About" },
    { path: "/api/contact", label: "Contact" },
    { path: "/api/faq", label: "FAQ" },
  ];

  // Footer links
  const footerLinks = [
    { path: "/", label: "Home" },
    { path: "/api/about", label: "About" },
    { path: "/api/contact", label: "Contact" },
    { path: "/api/faq", label: "FAQ" },
    { path: "/api/privacy", label: "Privacy Policy" },
  ];

  const socialLinks = [
    { href: "https://facebook.com", icon: "fab fa-facebook" },
    { href: "https://instagram.com", icon: "fab fa-instagram" },
    { href: "https://linkedin.com", icon: "fab fa-linkedin" },
    { href: "https://twitter.com", icon: "fab fa-twitter" },
  ];

  return (
    <>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg neu sticky-top">
        <div className="container">
          <NavLink className="navbar-brand" to="/">
            <i className="fa-solid fa-heart-pulse"></i> TheraTrack
          </NavLink>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
          >
            <i className="fa-solid fa-bars"></i>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              {navLinks
                .filter(link => !link.auth || isLoggedIn)
                .map(link => (
                  <li className="nav-item" key={link.path}>
                    <NavLink
                      to={link.path}
                      className={() => {
                        // Custom active logic for Home
                        if (link.path === "/") {
                          return location.pathname === "/" ||
                            location.pathname === "/home"
                            ? "nav-link active"
                            : "nav-link";
                        }
                        // Other links use React Router isActive
                        return location.pathname.startsWith(link.path)
                          ? "nav-link active"
                          : "nav-link";
                      }}
                    >
                      {link.label}
                    </NavLink>
                  </li>
                ))}
              {isLoggedIn && (
                <li className="nav-item">
                  <button
                    className="btn btn-outline-danger ms-2"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        <Outlet context={{ isLoggedIn, setIsLoggedIn }} />
      </main>

      {/* Footer */}
      <footer>
        <div>
          {footerLinks.map(link => (
            <NavLink
              key={link.path}
              to={link.path}
              className="footer-link"
              end={link.path === "/"}
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="mt-3">
          {socialLinks.map(social => (
            <a
              key={social.href}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social"
            >
              <i className={social.icon}></i>
            </a>
          ))}
        </div>

        <div className="footer-bottom mt-3">
          © {new Date().getFullYear()} PhysioCoach — Your AI-powered physiotherapy companion.
        </div>
      </footer>

      {/* Scroll Button */}
      {showScroll && (
        <button
          id="scrollTopBtn"
          className="scroll-top-btn animate-float show"
          onClick={() =>
            window.scrollTo({ top: 0, behavior: "smooth" })
          }
        >
          <i className="fa-solid fa-arrow-up-from-bracket"></i>
        </button>
      )}

      {/* Chatbot */}
      <ChatbotPopup />
    </>
  );
}

export default BaseLayout;
