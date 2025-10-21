import React, { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import "@fortawesome/fontawesome-free/css/all.min.css";
import "../../style.css";
import "../css/BaseLayout.css";
function BaseLayout() {
  const location = useLocation();
  const [showScroll, setShowScroll] = useState(false);

  // Show scroll-to-top button after scrolling down 100px
  useEffect(() => {
    const handleScroll = () => {
      setShowScroll(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg neu sticky-top">
        <div className="container">
          <Link className="navbar-brand" to="/">
            <i className="fa-solid fa-heart-pulse"></i> PhysioCoach
          </Link>

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
              {[
                { path: "/", label: "Home" },
                { path: "/exercises", label: "Exercises" },
                { path: "/profile", label: "Profile" },
                { path: "/about", label: "About" },
                { path: "/contact", label: "Contact" },
                { path: "/faq", label: "FAQ" },
              ].map((link) => (
                <li className="nav-item" key={link.path}>
                  <Link
                    className={`nav-link ${
                      location.pathname === link.path ? "active" : ""
                    }`}
                    to={link.path}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container">
        <Outlet />
      </main>

      {/* Footer */}
      <footer>
        <div>
          {[
            { path: "/", label: "Home" },
            { path: "/about", label: "About" },
            { path: "/contact", label: "Contact" },
            { path: "/faq", label: "FAQ" },
          ].map((link) => (
            <Link to={link.path} className="footer-link" key={link.path}>
              {link.label}
            </Link>
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

      {/* Scroll to Top Button */}
      {showScroll && (
        <button
          id="scrollTopBtn"
          className="scroll-top-btn animate-float"
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
