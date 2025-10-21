import React, { useState, useEffect, useRef } from "react";
import "../css/Login.css";

const Login = ({ messages = [] }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [popupMessage, setPopupMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const passwordRef = useRef(null);
  const canvasRef = useRef(null);

  // --- Popup helper ---
  const showPopupMessage = (message) => {
    setPopupMessage(message);
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 10000);
  };

  // --- Form submit ---
  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!username.trim()) newErrors.username = "Username is required";
    if (!password.trim()) newErrors.password = "Password is required";
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      console.log({ username, password });
      // Call API here
    }
  };

  // --- Password toggle ---
  const togglePassword = () => {
    if (passwordRef.current) {
      passwordRef.current.type =
        passwordRef.current.type === "password" ? "text" : "password";
    }
  };

  // --- Messages popup ---
  useEffect(() => {
    messages.forEach((msg) => showPopupMessage(msg));
  }, [messages]);

  // --- Particles ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let particlesArray = [];

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

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
      <canvas ref={canvasRef} id="particles"></canvas>

      <div
        className="login-card p-5 rounded-4 glass-card position-relative"
        style={{ width: "95%", maxWidth: "450px", zIndex: 1 }}
      >
        <h2 className="fw-bold mb-4 text-center" style={{ color: "#1b4332" }}>
          Welcome Back
        </h2>

        {showPopup && (
          <div className="popup show">
            <span className="fw-semibold">{popupMessage}</span>
            <button id="closePopup" onClick={() => setShowPopup(false)}>
              &times;
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3 text-start">
            <label
              htmlFor="username"
              className="form-label fw-semibold"
              style={{ color: "#1b4332" }}
            >
              Username
            </label>
            <input
              type="text"
              className="form-control neumorphic-input"
              id="username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            {errors.username && (
              <div className="form-error">{errors.username}</div>
            )}
          </div>

          <div className="mb-3 text-start position-relative">
            <label
              htmlFor="password"
              className="form-label fw-semibold"
              style={{ color: "#1b4332" }}
            >
              Password
            </label>
            <input
              type="password"
              className="form-control neumorphic-input"
              id="password"
              placeholder="Enter your password"
              ref={passwordRef}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <i
              className="fa fa-eye password-toggle"
              onClick={togglePassword}
            ></i>
            {errors.password && (
              <div className="form-error">{errors.password}</div>
            )}
          </div>

          <button type="submit" className="btn neon-btn w-100 mb-3">
            Login
          </button>

          <p style={{ color: "#1b4332" }}>
            Don't have an account?{" "}
            <a
              href="/register"
              className="text-success fw-bold text-decoration-underline"
            >
              Register
            </a>
          </p>
          <p style={{ color: "#1b4332" }} className="text-center">
            <a
              href="/forgotpassword"
              className="text-danger fw-bold text-decoration-underline"
            >
              Forgot Password?
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
