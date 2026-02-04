import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "@fortawesome/fontawesome-free/css/all.min.css";
import logo from "../../assets/images/logo.png";
import "../../style.css";
import "../css/BaseLayout.css";

// Import Chatbot
import ChatbotPopup from "../pages/ChatbotPopup";

function BaseLayout() {
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showScroll, setShowScroll] = useState(false);
  const [isFooterVisible, setIsFooterVisible] = useState(false);

  // Hide navbar/footer on certain routes
  const hideLayoutRoutes = ["/login"];
  const hideLayout = hideLayoutRoutes.includes(location.pathname);

  // Check login status using JWT token
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    setIsLoggedIn(!!token); // true if token exists
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
      setIsFooterVisible(footerTop < window.innerHeight);
    };
    window.addEventListener("scroll", handleFooterScroll);
    window.addEventListener("resize", handleFooterScroll);
    handleFooterScroll(); // run once
    return () => {
      window.removeEventListener("scroll", handleFooterScroll);
      window.removeEventListener("resize", handleFooterScroll);
    };
  }, []);

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    setIsLoggedIn(false);
    window.location.href = "/login";
  };

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

  return (
    <>
      {/* Navbar */}
      {!hideLayout && (
        <nav className="navbar navbar-expand-lg neu sticky-top">
          <div className="container">
            <NavLink className="navbar-brand" to="/">
              <img src={logo} alt="logo" className="card-img-side" />
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
                        className={({ isActive }) =>
                          isActive ? "nav-link active" : "nav-link"
                        }
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
                TheraTrack helps mental health awareness and personal well-being
                through structured tracking and intelligent assistance.
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
              <p>
                <i className="fas fa-envelope"></i> noreply.theratrack@gmail.com
              </p>
              <p>
                <i className="fas fa-map-marker-alt"></i> London, United Kingdom
              </p>
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
