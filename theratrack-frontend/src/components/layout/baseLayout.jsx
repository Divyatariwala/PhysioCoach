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
  const [isFooterVisible, setIsFooterVisible] = useState(false);

  const location = useLocation();

  // 🚫 Routes where navbar & footer should be hidden
  const hideLayoutRoutes = ["/login"];
  const hideLayout = hideLayoutRoutes.includes(location.pathname);

  // Check login status
  useEffect(() => {
    setIsLoggedIn(localStorage.getItem("isLoggedIn") === "true");

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

  // Scroll button logic
  useEffect(() => {
    const handleScroll = () => setShowScroll(window.scrollY > 100);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll button logic
  useEffect(() => {
    const handleScroll = () => setShowScroll(window.scrollY > 100);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Footer visibility logic for chatbot button
  useEffect(() => {
    const footer = document.querySelector("footer");

    const handleFooterScroll = () => {
      if (!footer) return;
      const footerTop = footer.getBoundingClientRect().top;
      const windowHeight = window.innerHeight;
      setIsFooterVisible(footerTop < windowHeight);
    };

    window.addEventListener("scroll", handleFooterScroll);
    window.addEventListener("resize", handleFooterScroll);

    handleFooterScroll(); // run once on mount

    return () => {
      window.removeEventListener("scroll", handleFooterScroll);
      window.removeEventListener("resize", handleFooterScroll);
    };
  }, []);

  // Navbar links
  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/api/exercises", label: "Exercises", auth: true },
    { path: "/api/profile", label: "Profile", auth: true },
    { path: "/api/about", label: "About" },
    { path: "/api/contact", label: "Contact" },
  ];

  // Footer links
  const footerLinks = [
    { path: "/", label: "Home" },
    { path: "/api/about", label: "About" },
    { path: "/api/contact", label: "Contact" },
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
      {!hideLayout && (
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
                          if (link.path === "/") {
                            return location.pathname === "/" ||
                              location.pathname === "/home"
                              ? "nav-link active"
                              : "nav-link";
                          }
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
                      className="btn btn-primary ms-2"
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
      )}

      {/* Main Content */}
      <main className="main-content">
        <Outlet context={{ isLoggedIn, setIsLoggedIn }} />
      </main>

      {/* Footer */}
      {!hideLayout && (
        <footer className="footer">
          <div className="container">
            <div className="footer-section footer-about">
              <h4>About TheraTrack</h4>
              <p>
                TheraTrack is a digital platform designed to support mental health awareness
                and personal well-being through structured tracking and intelligent assistance.
              </p>
            </div>

            <div className="footer-section footer-links">
              <h4>Quick Links</h4>
              {footerLinks.map(link => (
                <NavLink key={link.path} to={link.path} className="footer-link">
                  {link.label}
                </NavLink>
              ))}
            </div>

            <div className="footer-section footer-contact">
              <h4>Contact</h4>
              <p><i className="fas fa-envelope"></i> support@theratrack.com</p>
              <p><i className="fas fa-map-marker-alt"></i> United Kingdom</p>
            </div>

           
          </div>
           <div className="footer-bottom">
              © {new Date().getFullYear()} TheraTrack. All Rights Reserved.
            </div>
        </footer>

      )}

      {/* Scroll Button */}
      {!hideLayout && showScroll && (
        <button
          id="scrollTopBtn"
          className="scroll-top-btn animate-float show"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <i className="fa-solid fa-arrow-up-from-bracket"></i>
        </button>
      )}

      {/* Chatbot */}
      {!hideLayout && <ChatbotPopup footerVisible={isFooterVisible} />}
    </>
  );
}

export default BaseLayout;
