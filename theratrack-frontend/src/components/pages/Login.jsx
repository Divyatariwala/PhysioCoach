// Login.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../css/Login.css";

export default function Login() {
  const popupRef = useRef(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ username: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const loginSuccessMessages = [
    "✅ Login successful! Welcome back!",
  ];

  const loginErrorMessages = [
    "⚠️ Login failed! Check your username and password."
  ];

  const loginWarningMessages = {
    username: ["👤 Username missing!"],
    password: ["🔐 Password missing!"],
  };

  // --- Popup helper ---
  const showPopup = (message, redirect = null, success = false) => {
    const popup = popupRef.current;
    if (!popup) return;

    const popupMsg = popup.querySelector("#popupMessage");
    const popupBtn = popup.querySelector("#popupButton");
    const closeBtn = popup.querySelector("#closePopup");

    popupMsg.textContent = message;

    if (redirect) {
      popupBtn.textContent = "Go to Dashboard";
      popupBtn.style.display = "inline-block";
      popupBtn.onclick = () => {
        popup.classList.remove("show");
        navigate(redirect);
      };
    } else popupBtn.style.display = "none";

    if (success) triggerConfetti();
    popup.classList.add("show");

    closeBtn.onclick = () => popup.classList.remove("show");

    if (!success && !redirect) setTimeout(() => popup.classList.remove("show"), 8000);
  };

  // --- Confetti ---
  const triggerConfetti = () => {
    const confettiCount = 30;
    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement("div");
      confetti.innerText = "🎉✨🥳🎊"[Math.floor(Math.random() * 5)];
      confetti.style.position = "fixed";
      confetti.style.left = `${Math.random() * 100}vw`;
      confetti.style.top = `-50px`;
      confetti.style.fontSize = `${Math.random() * 30 + 20}px`;
      confetti.style.pointerEvents = "none";
      confetti.style.zIndex = 9999;
      confetti.style.transition = "transform 2s linear, opacity 2s linear";
      document.body.appendChild(confetti);

      requestAnimationFrame(() => {
        confetti.style.transform = `translateY(${window.innerHeight + 50}px) rotate(${Math.random() * 360}deg)`;
        confetti.style.opacity = "0";
      });
      setTimeout(() => document.body.removeChild(confetti), 2000);
    }
  };

  // --- Form Handlers ---
  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = loginWarningMessages.username[0];
    if (!formData.password.trim()) newErrors.password = loginWarningMessages.password[0];
    setErrors(newErrors);
    if (Object.keys(newErrors).length) return;

    try {
      const response = await fetch("http://localhost:8000/api/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username: formData.username, password: formData.password }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("username", data.username || formData.username);
        showPopup(
          loginSuccessMessages[Math.floor(Math.random() * loginSuccessMessages.length)],
          "/home",
          true
        );
      } else {
        showPopup(`❌ Login failed: ${data.error || loginErrorMessages[Math.floor(Math.random() * loginErrorMessages.length)]}`);
      }
    } catch (err) {
      console.error(err);
      showPopup("🌐 Network error. Check your connection and try again!");
    }
  };

  // --- Google Login ---
  const handleGoogleLogin = async response => {
    if (!response?.credential) return;
    try {
      const res = await fetch("http://localhost:8000/api/google-login/", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: response.credential }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("username", data.username || "User");
        showPopup("✅ Google login successful!", "/home", true);
      } else {
        showPopup(`❌ Google login failed: ${data.error}`);
        console.error("Google login error:", data.error);
      }
    } catch (err) {
      console.error(err);
      showPopup("🌐 Google login error");
    }
  };

  useEffect(() => {
    if (!window.google) return;
    window.google.accounts.id.initialize({
      client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
      callback: handleGoogleLogin,
      ux_mode: "popup",
    });
    window.google.accounts.id.renderButton(document.getElementById("googleLoginBtn"), {
      theme: "outline",
      size: "large",
      width: "100%",
    });
    window.google.accounts.id.prompt();
  }, []);

  return (
    <div className="login-page d-flex justify-content-center align-items-center position-relative" style={{ minHeight: "100vh", overflow: "hidden", background: "#e0f1e7" }}>
      <div className="login-card p-5 rounded-4 glass-card position-relative" style={{ width: "95%", maxWidth: "450px", zIndex: 1 }}>
        <h2 className="fw-bold mb-4 text-center" style={{ color: "#1b4332" }}>Welcome Back</h2>

        <div className="popup" ref={popupRef}>
          <span id="popupMessage" className="fw-semibold"></span>
          <button type="button" id="popupButton" style={{ display: "none" }}></button>
          <button type="button" id="closePopup">&times;</button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3 text-start">
            <label htmlFor="username" className="form-label fw-semibold" style={{ color: "#1b4332" }}>Username</label>
            <input type="text" className="form-control neumorphic-input" id="username" name="username" placeholder="Enter your username" value={formData.username} onChange={handleChange} />
            {errors.username && <div className="form-error">{errors.username}</div>}
          </div>

          <div className="mb-3 text-start position-relative">
            <label htmlFor="password" className="form-label fw-semibold" style={{ color: "#1b4332" }}>Password</label>
            <input type={showPassword ? "text" : "password"} className="form-control neumorphic-input" id="password" name="password" placeholder="Enter your password" value={formData.password} onChange={handleChange} />
            <i className={`fa ${showPassword ? "fa-eye-slash" : "fa-eye"} password-toggle`} onClick={() => setShowPassword(!showPassword)}></i>
            {errors.password && <div className="form-error">{errors.password}</div>}
          </div>

          <button type="submit" className="btn neon-btn w-100 mb-3">Login</button>
          <div id="googleLoginBtn" className="mb-3"></div>

          <p style={{ color: "#1b4332" }} className="text-center">
            If you don't have an account,{" "}
            <a href="/api/register" className="text-success fw-bold text-decoration-underline">Register</a>
          </p>
        </form>
      </div>
    </div>
  );
}
