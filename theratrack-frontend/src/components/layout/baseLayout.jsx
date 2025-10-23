import React, { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "../../style.css";
import "../css/BaseLayout.css";

function BaseLayout() {
  const [showScroll, setShowScroll] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check login status from localStorage
  useEffect(() => {
    const token = localStorage.getItem("isLoggedIn");
    if (token === "true") setIsLoggedIn(true);
  }, []);

  // Show scroll-to-top button after scrolling
  useEffect(() => {
    const handleScroll = () => setShowScroll(window.scrollY > 100);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "api/exercises", label: "Exercises", auth: true },
    { path: "api/profile", label: "Profile", auth: true },
    { path: "api/about", label: "About" },
    { path: "api/contact", label: "Contact" },
    { path: "api/faq", label: "FAQ" },
  ];

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("username");
    setIsLoggedIn(false);
    window.location.href = "/"; // redirect to home after logout
  };

  return (
    <>
      {/* ===== Navbar ===== */}
      <nav className="navbar navbar-expand-lg neu sticky-top">
        <div className="container">
          <NavLink className="navbar-brand" to="/">
            <i className="fa-solid fa-heart-pulse"></i> PhysioCoach
          </NavLink>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <i className="fa-solid fa-bars"></i>
          </button>

          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              {navLinks
                .filter((link) => !link.auth || isLoggedIn)
                .map((link) => (
                  <li className="nav-item" key={link.path}>
                    <NavLink
                      to={link.path}
                      end={link.path === "/"}
                      className={({ isActive }) =>
                        isActive ? "nav-link active" : "nav-link"
                      }
                    >
                      {link.label}
                    </NavLink>
                  </li>
                ))}

              {/* Logout button if logged in */}
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

      {/* ===== Main Content ===== */}
      <main className="container">
        <Outlet />
      </main>

      {/* ===== Footer ===== */}
      <footer>
        <div>
          {[
            { path: "/", label: "Home" },
            { path: "api/about", label: "About" },
            { path: "api/contact", label: "Contact" },
            { path: "api/faq", label: "FAQ" },
          ].map((link) => (
            <NavLink
              to={link.path}
              key={link.path}
              className="footer-link"
              end={link.path === "/"}
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="mt-3">
          {[
            { href: "https://facebook.com", icon: "fab fa-facebook" },
            { href: "https://instagram.com", icon: "fab fa-instagram" },
            { href: "https://linkedin.com", icon: "fab fa-linkedin" },
            { href: "https://twitter.com", icon: "fab fa-twitter" },
          ].map((social) => (
            <a
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social"
              key={social.href}
            >
              <i className={social.icon}></i>
            </a>
          ))}
        </div>

        <div className="footer-bottom mt-3">
          &copy; {new Date().getFullYear()} PhysioCoach — Your AI-powered
          physiotherapy companion.
        </div>
      </footer>

      {/* ===== Scroll to Top Button ===== */}
      {showScroll && (
        <button
          id="scrollTopBtn"
          className={`scroll-top-btn animate-float ${showScroll ? "show" : ""}`}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Scroll to top"
        >
          <i className="fa-solid fa-arrow-up-from-bracket"></i>
        </button>
      )}

    </>
  );
}

export default BaseLayout;
