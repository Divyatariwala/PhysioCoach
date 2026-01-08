import React, { useState, useEffect } from "react";
import "../css/CookiesBanner.css";

const CookiesBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Get CSRF token from cookies
  const getCSRFToken = () => {
    const name = "csrftoken";
    const cookies = document.cookie.split(";").map(c => c.trim());
    const cookie = cookies.find(c => c.startsWith(name + "="));
    return cookie ? decodeURIComponent(cookie.split("=")[1]) : null;
  };

  // Check login status and cookie consent
  useEffect(() => {
    async function checkConsent() {
      try {
        const res = await fetch("http://localhost:8000/api/get-cookie-consent/", {
          method: "GET",
          credentials: "include", // This tells the browser to send the sessionid
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
          },
        });

        if (!res.ok) return;

        const data = await res.json();

        if (data.isLoggedIn) {
          setIsLoggedIn(true);
          if (!data.cookiesAccepted) setShowBanner(true);
        } else {
          setIsLoggedIn(false);
          setShowBanner(false); // hide banner for anonymous
        }
      } catch (err) {
        console.warn("Backend unavailable, cookie banner skipped");
      }
    }

    checkConsent();
  }, []);


  // Handle "Accept" button click
  const handleAccept = async () => {
    const csrfToken = getCSRFToken();
    if (!csrfToken) {
      console.error("CSRF token missing. Login may be required.");
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/api/set-cookie-consent/", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify({ cookiesAccepted: true }),
      });

      if (!res.ok) {
        const data = await res.json();
        console.error("Failed to set cookie consent:", data.error);
        return;
      }

      // Hide banner after successful consent
      setShowBanner(false);
    } catch (err) {
      console.error("Error setting cookie consent:", err);
    }
  };

  // Only show banner for logged-in users who haven't accepted cookies
  if (!isLoggedIn || !showBanner) return null;

  return (
    <div className={`cookies-banner ${showBanner ? "show" : ""}`}>
      <p>
        🍃 We use cookies to enhance your experience. By continuing, you agree
        to our <a href="/api/privacy">Privacy Policy</a>.
      </p>
      <button className="accept-btn" onClick={handleAccept}>
        Accept
      </button>
    </div>
  );
};

export default CookiesBanner;
