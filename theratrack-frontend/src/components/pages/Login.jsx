import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom"; // <-- import useNavigate
import "../css/Login.css";

export default function Login() {
  const canvasRef = useRef(null);
  const popupRef = useRef(null);
  const navigate = useNavigate(); // <-- hook to navigate programmatically

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // --- Popup ---
  const showPopup = (message, redirect = null) => {
    const popup = popupRef.current;
    if (!popup) return;

    const popupMsg = popup.querySelector("#popupMessage");
    const popupBtn = popup.querySelector("#popupButton");
    const closeBtn = popup.querySelector("#closePopup");

    popupMsg.textContent = message;

    if (redirect) {
      popupBtn.textContent = "Go to Dashboard";
      popupBtn.style.display = "inline-block";
      popupBtn.onclick = () => navigate(redirect); // <-- use navigate
    } else {
      popupBtn.style.display = "none";
    }

    popup.classList.add("show");
    closeBtn.onclick = () => popup.classList.remove("show");
    if (!redirect) setTimeout(() => popup.classList.remove("show"), 8000);
  };

  // --- Form submit ---
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = "Username is required";
    if (!formData.password.trim()) newErrors.password = "Password is required";
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
      });

      if (!response.ok) {
        showPopup("Invalid username or password.");
        return;
      }

      const data = await response.json();

      // ✅ Only here, after successful login
      if (data.success) {
        localStorage.setItem("isLoggedIn", "true"); // ← save login state
        localStorage.setItem("username", data.username || formData.username); // optional
        showPopup("✅ Login successful!", "/home"); // redirect to home
         // reload page so BaseLayout picks up login
        window.location.href = "/";
      } else {
        showPopup(data.error || "Login failed");
      }
    } catch (err) {
      console.error(err);
      showPopup("Network error. Please try again.");
    }
  };

  // --- Particles (same as before) ---
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
      <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0 }} />
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
          <button type="button" id="closePopup">
            &times;
          </button>
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
            <i className={`fa ${showPassword ? "fa-eye-slash" : "fa-eye"} password-toggle`} onClick={() => setShowPassword(!showPassword)}></i>
            {errors.password && <div className="form-error">{errors.password}</div>}
          </div>

          <button type="submit" className="btn neon-btn w-100 mb-3">
            Login
          </button>

          <p style={{ color: "#1b4332" }} className="text-center">
            <a href="/register" className="text-success fw-bold text-decoration-underline">
              Register
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
