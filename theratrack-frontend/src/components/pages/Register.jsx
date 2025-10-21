import React, { useState, useEffect, useRef } from "react";
import "../css/Register.css";

export default function Register() {
  const canvasRef = useRef(null);
  const popupRef = useRef(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    age: "",
    gender: "",
    password1: "",
    password2: "",
  });

  const [errors, setErrors] = useState({});
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // --- Particles ---
  useEffect(() => {
    const canvas = canvasRef.current;
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

  // --- Popup ---
  const showPopup = (message) => {
    const popup = popupRef.current;
    if (!popup) return;
    const popupMsg = popup.querySelector("#popupMessage");
    const closeBtn = popup.querySelector("#closePopup");
    popupMsg.textContent = message;
    popup.classList.add("show");

    closeBtn.onclick = () => {
      popup.classList.remove("show");
    };

    setTimeout(() => popup.classList.remove("show"), 10000);
  };

  // --- Form ---
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  const selectGender = (value) => {
    setFormData({ ...formData, gender: value });
    setDropdownOpen(false);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName) newErrors.firstName = "First Name required";
    if (!formData.lastName) newErrors.lastName = "Last Name required";
    if (!formData.username) newErrors.username = "Username required";
    if (!formData.email) newErrors.email = "Email required";
    if (!formData.age || formData.age < 1 || formData.age > 120)
      newErrors.age = "Valid age required";
    if (!formData.gender) newErrors.gender = "Gender required";
    if (!formData.password1) newErrors.password1 = "Password required";
    if (formData.password1 !== formData.password2)
      newErrors.password2 = "Passwords do not match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    showPopup("Form submitted successfully!");
    console.log(formData);
    // Call API to submit
  };

  return (
    <div
      className="register-page d-flex justify-content-center align-items-center position-relative"
      style={{ minHeight: "100vh", overflow: "hidden", background: "#e0f1e7" }}
    >
      <canvas ref={canvasRef} id="particles"></canvas>

      <div
        className="register-card p-5 rounded-4 glass-card position-relative text-start"
        style={{ width: "100%", maxWidth: "556px", zIndex: 1 }}
      >
        <h2
          className="fw-bold mb-4 text-center"
          style={{ color: "#1b4332" }}
        >
          Create Your Account
        </h2>

        <div className="popup d-none" ref={popupRef}>
          <span id="popupMessage" className="fw-semibold"></span>
          <button type="button" id="closePopup">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="row mb-3">
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold" style={{ color: "#1b4332" }}>
                First Name
              </label>
              <input
                type="text"
                className="form-control neumorphic-input"
                placeholder="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
              />
              <div className="form-error">{errors.firstName}</div>
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold" style={{ color: "#1b4332" }}>
                Last Name
              </label>
              <input
                type="text"
                className="form-control neumorphic-input"
                name="lastName"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleChange}
              />
              <div className="form-error">{errors.lastName}</div>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold" style={{ color: "#1b4332" }}>
              Username
            </label>
            <input
              type="text"
              className="form-control neumorphic-input"
              placeholder="Username"
              name="username"
              value={formData.username}
              onChange={handleChange}
            />
            <div className="form-error">{errors.username}</div>
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold" style={{ color: "#1b4332" }}>
              Email
            </label>
            <input
              type="email"
              className="form-control neumorphic-input"
              placeholder="Enter your email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
            <div className="form-error">{errors.email}</div>
          </div>

          <div className="row mb-3">
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold" style={{ color: "#1b4332" }}>
                Age
              </label>
              <input
                type="number"
                className="form-control neumorphic-input"
                placeholder="Enter your age"
                name="age"
                value={formData.age}
                onChange={handleChange}
                min="1"
                max="120"
              />
              <div className="form-error">{errors.age}</div>
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold" style={{ color: "#1b4332" }}>
                Gender
              </label>
              <div className="custom-select-wrapper m-0">
                <div className="custom-select" onClick={toggleDropdown}>
                  {formData.gender || "Select your gender"}
                  <div className={`custom-options ${dropdownOpen ? "show" : ""}`}>
                    {["Male", "Female", "Other"].map((opt) => (
                      <div key={opt} className="custom-option" onClick={() => selectGender(opt)}>
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="form-error">{errors.gender}</div>
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold" style={{ color: "#1b4332" }}>
                Password
              </label>
              <input
                type="password"
                className="form-control neumorphic-input"
                placeholder="Create a password"
                name="password1"
                value={formData.password1}
                onChange={handleChange}
              />
              <div className="form-error">{errors.password1}</div>
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold" style={{ color: "#1b4332" }}>
                Confirm Password
              </label>
              <input
                type="password"
                className="form-control neumorphic-input"
                name="password2"
                placeholder="Confirm your password"
                value={formData.password2}
                onChange={handleChange}
              />
              <div className="form-error">{errors.password2}</div>
            </div>
          </div>

          <button type="submit" className="btn neon-btn w-100 mb-3">
            Register
          </button>

          <p className="text-center" style={{ color: "#1b4332" }}>
            Already have an account?{" "}
            <a href="/login" className="text-success fw-bold text-decoration-underline">
              Login
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}










// start with the exercises page
// profil page,
// about page,
// contact page.
// show only the navbar when login 
// backend with the frontend