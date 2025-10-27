import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../css/Login.css";

export default function Login() {
  const canvasRef = useRef(null);
  const popupRef = useRef(null);
  const navigate = useNavigate();

  const getCSRFToken = () => {
    const name = "csrftoken";
    const cookies = document.cookie.split(";").map(c => c.trim());
    for (let cookie of cookies) {
      if (cookie.startsWith(name + "=")) {
        return decodeURIComponent(cookie.split("=")[1]);
      }
    }
    return null;
  };

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const loginSuccessMessages = [
    "🏃‍♂️ You’re back on track! Let’s crush those goals!",
    "🎯 Bullseye! Login successful — time to track like a pro!",
    "💪 Welcome back, champ! Your progress awaits!",
    "🚀 Blast off! You’re officially in Thratrack mode!",
    "✨ All systems go! Your stats are ready to shine!",
  ];

  const loginErrorMessages = [
    "⚠️ Hmmm… username or password seems off — check your track!",
    "🤔 Login failed! Did you forget your Thratrack secret?",
    "❌ Oops! No entry to the tracking universe without correct creds.",
    "🛑 Halt! Your credentials need a tune-up.",
    "💢 Wrong combo! Even Thratrack can’t track you in here!",
  ];

  const loginWarningMessages = {
    username: [
      "⚡ Whoa! Can’t track without a username — who are you?",
      "🕵️‍♂️ Username missing! Reveal your Thratrack identity.",
    ],
    password: [
      "🔐 Password missing! No progress without the secret code.",
      "⚡ Keep it secure! Enter your password to continue tracking.",
    ],
  };

  // --- Confetti Function ---
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

  // --- Popup function ---
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
      popupBtn.onclick = () => navigate(redirect);
    } else {
      popupBtn.style.display = "none";
    }

    if (success) triggerConfetti();

    popup.classList.add("show");

    closeBtn.onclick = () => popup.classList.remove("show");

    if (!success && !redirect) setTimeout(() => popup.classList.remove("show"), 8000);
  };

  // --- Form handlers ---
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!formData.username.trim())
      newErrors.username =
        loginWarningMessages.username[
          Math.floor(Math.random() * loginWarningMessages.username.length)
        ];
    if (!formData.password.trim())
      newErrors.password =
        loginWarningMessages.password[
          Math.floor(Math.random() * loginWarningMessages.password.length)
        ];
    setErrors(newErrors);
    if (Object.keys(newErrors).length) return;

    try {
      const formDataObj = new FormData();
      formDataObj.append("username", formData.username);
      formDataObj.append("password", formData.password);

      const response = await fetch("http://localhost:8000/api/login/", {
        method: "POST",
        body: formDataObj,
        credentials: "include",
        headers: {
          "X-CSRFToken": getCSRFToken(),
        },
      });

      if (!response.ok) {
        const msg =
          loginErrorMessages[
            Math.floor(Math.random() * loginErrorMessages.length)
          ];
        showPopup(msg);
        return;
      }

      const data = await response.json();

      if (data.success) {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("username", data.username || formData.username);

        const randomSuccess =
          loginSuccessMessages[
            Math.floor(Math.random() * loginSuccessMessages.length)
          ];
        showPopup(randomSuccess, "/home", true);

        // reload page so BaseLayout picks up login
        setTimeout(() => window.location.href = "/", 1500);
      } else {
        const msg =
          loginErrorMessages[
            Math.floor(Math.random() * loginErrorMessages.length)
          ];
        showPopup(msg);
      }
    } catch (err) {
      console.error(err);
      const msg = "🌐 Network error. Check your connection and try again!";
      showPopup(msg);
    }
  };

  // --- Particle background ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    let particlesArray = [];

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() - 0.5;
        this.speedY = Math.random() - 0.5;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
      }
      draw() {
        ctx.fillStyle = "rgba(76,175,80,0.3)";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const initParticles = () => {
      particlesArray = [];
      for (let i = 0; i < 80; i++) particlesArray.push(new Particle());
    };

    const animateParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesArray.forEach((p) => {
        p.update();
        p.draw();
      });
      requestAnimationFrame(animateParticles);
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    initParticles();
    animateParticles();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      className="login-page d-flex justify-content-center align-items-center position-relative"
      style={{ minHeight: "100vh", overflow: "hidden", background: "#e0f1e7" }}
    >
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0 }}
      />

      <div
        className="login-card p-5 rounded-4 glass-card position-relative"
        style={{ width: "95%", maxWidth: "450px", zIndex: 1 }}
      >
        <h2 className="fw-bold mb-4 text-center" style={{ color: "#1b4332" }}>
          Welcome Back
        </h2>

        <div className="popup" ref={popupRef}>
          <span id="popupMessage" className="fw-semibold"></span>
          <button type="button" id="popupButton" style={{ display: "none" }}></button>
          <button type="button" id="closePopup">&times;</button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3 text-start">
            <label htmlFor="username" className="form-label fw-semibold" style={{ color: "#1b4332" }}>
              Username
            </label>
            <input
              type="text"
              className="form-control neumorphic-input"
              id="username"
              name="username"
              placeholder="Enter your username"
              value={formData.username}
              onChange={handleChange}
            />
            {errors.username && <div className="form-error">{errors.username}</div>}
          </div>

          <div className="mb-3 text-start position-relative">
            <label htmlFor="password" className="form-label fw-semibold" style={{ color: "#1b4332" }}>
              Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              className="form-control neumorphic-input"
              id="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
            />
            <i
              className={`fa ${showPassword ? "fa-eye-slash" : "fa-eye"} password-toggle`}
              onClick={() => setShowPassword(!showPassword)}
            ></i>
            {errors.password && <div className="form-error">{errors.password}</div>}
          </div>

          <button type="submit" className="btn neon-btn w-100 mb-3">
            Login
          </button>

          <p style={{ color: "#1b4332" }} className="text-center">
            If you don't have an account,{" "}
            <a href="/api/register" className="text-success fw-bold text-decoration-underline">
              Register
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
