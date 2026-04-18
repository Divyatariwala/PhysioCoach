import React, { useState, useEffect } from "react";
import "../css/CookiesBanner.css";

const CookiesBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const checkConsent = async () => {
      const token = localStorage.getItem("access_token");

      // ---------------- DEV MODE RESET (NO MORE CONSOLE WORK) ----------------
      if (process.env.NODE_ENV === "development") {
        localStorage.removeItem("cookiesAccepted");
      }

      const isLoggedIn = token && token !== "null" && token !== "undefined";

      // ---------------- GUEST USER ----------------
      if (!isLoggedIn) {
        const consent = localStorage.getItem("cookiesAccepted");
        const accepted = consent === "true";

        console.log("GUEST MODE:", consent);

        setShowBanner(!accepted);
        setReady(true);
        return;
      }

      // ---------------- LOGGED IN USER ----------------
      try {
        const res = await fetch(
          "http://localhost:8000/api/get-cookie-consent/",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) throw new Error("API error");

        const data = await res.json();

        setShowBanner(!data.cookiesAccepted);
      } catch (err) {
        console.warn("Backend failed → fallback to localStorage");

        const consent = localStorage.getItem("cookiesAccepted");
        const accepted = consent === "true";

        setShowBanner(!accepted);
      }

      setReady(true);
    };

    checkConsent();
  }, []);

  const handleAccept = async () => {
    const token = localStorage.getItem("access_token");
    const isLoggedIn = token && token !== "null" && token !== "undefined";

    setShowBanner(false);

    // ---------------- GUEST USER ----------------
    if (!isLoggedIn) {
      localStorage.setItem("cookiesAccepted", "true");
      return;
    }

    // ---------------- LOGGED IN USER ----------------
    try {
      await fetch("http://localhost:8000/api/set-cookie-consent/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ cookiesAccepted: true }),
      });

      // keep local sync for fallback
      localStorage.setItem("cookiesAccepted", "true");
    } catch (err) {
      console.error("Failed to save consent:", err);

      // fallback safety
      localStorage.setItem("cookiesAccepted", "true");
    }
  };

  // ---------------- SAFETY ----------------
  if (!ready) return null;
  if (!showBanner) return null;

  return (
    <div className={`cookies-banner ${showBanner ? "show" : ""}`}>
      <p>
        We use cookies to enhance your experience. By continuing, you agree
        to our <a href="/api/privacy">Privacy Policy</a>.
      </p>

      <button className="accept-btn" onClick={handleAccept}>
        Accept
      </button>
    </div>
  );
};

export default CookiesBanner;