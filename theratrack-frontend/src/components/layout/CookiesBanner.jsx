import React, { useState, useEffect } from "react";
import "../css/CookiesBanner.css";

const CookiesBanner = () => {
  const [showBanner, setShowBanner] = useState(false);

  // Safe CSRF token getter
  const getCSRFToken = () => {
    const name = "csrftoken";
    const cookies = document.cookie ? document.cookie.split(";").map(c => c.trim()) : [];
    for (let cookie of cookies) {
      if (cookie.startsWith(name + "=")) {
        return decodeURIComponent(cookie.split("=")[1]);
      }
    }
    return null;
  };

  // Check if user has accepted cookies
  useEffect(() => {
    async function checkConsent() {
      try {
        const res = await fetch("http://localhost:8000/api/get-cookie-consent/", {
          credentials: "include",
        });
        const data = await res.json();
        if (!data.cookiesAccepted) {
          setShowBanner(true);
        }
      } catch (err) {
        console.error("Error checking cookie consent:", err);
      }
    }

    checkConsent();
  }, []);

  // Handle accept click
  const handleAccept = async () => {
    try {
      await fetch("http://localhost:8000/api/set-cookie-consent/", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCSRFToken(),
        },
        body: JSON.stringify({ cookiesAccepted: true }),
      });
      setShowBanner(false);
    } catch (err) {
      console.error("Error setting cookie consent:", err);
    }
  };

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
