import React, { useState, useEffect, useRef } from "react";
import { Eye, EyeOff } from "lucide-react";
import "../css/Register.css";
import confetti from "canvas-confetti";

// Reusable Password Input Component
const PasswordField = ({
  label,
  name,
  value,
  error,
  showPassword,
  toggleShowPassword,
  handleChange,
  passwordStrength,
}) => (
  <div className="mb-3 position-relative text-start">
    <label className="form-label fw-semibold" style={{ color: "#1b4332" }}>
      {label}
    </label>
    <div style={{ position: "relative" }}>
      <input
        type={showPassword[name] ? "text" : "password"}
        className="form-control neumorphic-input"
        placeholder={label}
        name={name}
        value={value}
        onChange={handleChange}
        style={{ paddingRight: "40px" }}
      />
      <span
        onClick={() => toggleShowPassword(name)}
        style={{
          position: "absolute",
          right: "10px",
          top: "50%",
          transform: "translateY(-50%)",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        {showPassword[name] ? <EyeOff size={18} /> : <Eye size={18} />}
      </span>
    </div>

    {passwordStrength && name === "password1" && (
      <>
        <div className={`password-strength-text mt-1 ${passwordStrength.toLowerCase()}`}>
          {passwordStrength} password
        </div>
        <div className="password-strength-bar-container mt-1">
          <div
            className={`password-strength-bar ${passwordStrength.toLowerCase()}`}
            style={{
              width:
                passwordStrength === "Weak"
                  ? "33%"
                  : passwordStrength === "Medium"
                    ? "66%"
                    : "100%",
            }}
          ></div>
        </div>
      </>
    )}

    {error && <div className="form-error">{error}</div>}
  </div>
);

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
  const [passwordStrength, setPasswordStrength] = useState("");
  const [showPassword, setShowPassword] = useState({
    password1: false,
    password2: false,
  });

  // --- Password Strength Checker ---
  const getPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[@$!%*?&]/.test(password)) strength++;

    if (strength <= 2) return "Weak";
    if (strength === 3 || strength === 4) return "Medium";
    if (strength === 5) return "Strong";
    return "";
  };

  const isStrongPassword = (password) => getPasswordStrength(password) === "Strong";

  const toggleShowPassword = (field) => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };

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
  const showPopup = (message, success = false) => {
    const popup = popupRef.current;
    if (!popup) return;

    const popupMsg = popup.querySelector("#popupMessage");
    const popupBtn = popup.querySelector("#popupButton");
    const closeBtn = popup.querySelector("#closePopup");

    popupMsg.textContent = message;

    if (success) {
      popupBtn.textContent = "Go to Login";
      popupBtn.style.display = "inline-block";
      popupBtn.onclick = () => (window.location.href = "/api/login");

      // 🎊 Trigger confetti on success
      confetti({
        particleCount: 200,
        angle: 60,
        spread: 120,
        origin: { x: 0 },
        colors: ["#4CAF50", "#1b4332", "#e0f1e7", "#FFD700"],
      });
      confetti({
        particleCount: 200,
        angle: 120,
        spread: 120,
        origin: { x: 1 },
        colors: ["#4CAF50", "#1b4332", "#e0f1e7", "#FFD700"],
      });
    } else {
      popupBtn.style.display = "none";
    }

    popup.classList.add("show");
    closeBtn.onclick = () => popup.classList.remove("show");
    if (!success) setTimeout(() => popup.classList.remove("show"), 8000);
  };

  // --- Form ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === "password1") setPasswordStrength(getPasswordStrength(value));
  };

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  const selectGender = (value) => {
    setFormData({ ...formData, gender: value });
    setDropdownOpen(false);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName) newErrors.firstName = "Please enter your first name 🌿";
    if (!formData.lastName) newErrors.lastName = "We’d love to know your last name too ✨";
    if (!formData.username) newErrors.username = "Pick a cool username for your journey!";
    if (!formData.email) newErrors.email = "We’ll use this to keep you updated — please enter your email 📬";

    if (!formData.age) {
      newErrors.age = "Your age helps us personalize your wellness plan 🌱";
    } else if (formData.age < 18) {
      newErrors.age = "🚫 You must be at least 18 years old to register for TheraTrack.";
    } else if (formData.age > 100) {
      newErrors.age = "Please enter a valid age (under 120).";
    }
    if (!formData.gender) newErrors.gender = "Select your gender so we can tailor your experience 🌼";
    if (!formData.password1)
      newErrors.password1 = "Create a secure password to protect your progress 🔒";
    else if (!isStrongPassword(formData.password1))
      newErrors.password1 =
        "Make it strong! Use at least 8 characters with uppercase, lowercase, numbers & a symbol 💪";
    if (formData.password1 !== formData.password2)
      newErrors.password2 = "Oops! Those passwords don’t match — try again 😊";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const response = await fetch("http://localhost:8000/api/register/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        showPopup(data.error || "Registration failed");
      } else {
        showPopup(
          "🎉 Hooray! You're now registered and ready to track your progress!",
          true
        );
        setFormData({
          firstName: "",
          lastName: "",
          username: "",
          email: "",
          age: "",
          gender: "",
          password1: "",
          password2: "",
        });
        setPasswordStrength("");
      }
    } catch (error) {
      console.error("Error:", error);
      showPopup("Something went wrong. Please try again.");
    }
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
        <h2 className="fw-bold mb-4 text-center" style={{ color: "#1b4332" }}>
          Create Your Account
        </h2>

        <div className="popup" ref={popupRef}>
          <span id="popupMessage" className="fw-semibold"></span>
          <button type="button" id="popupButton" style={{ display: "none" }}></button>
          <button type="button" id="closePopup">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="row mb-3 name-fields">
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
            <div className="col-12 col-md-6" id="lastName">
              <label className="form-label fw-semibold" style={{ color: "#1b4332" }}>
                Last Name
              </label>
              <input
                type="text"
                className="form-control neumorphic-input"
                placeholder="Last Name"
                name="lastName"
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
            <div className="col-12 col-md-6" id="age">
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
                min="18"
                max="100"
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

          {/* Passwords */}
          <div className="row mb-3 password-fields">
            <div className="col-12 col-md-6">
              <PasswordField
                label="Password"
                name="password1"
                value={formData.password1}
                error={errors.password1}
                handleChange={handleChange}
                showPassword={showPassword}
                toggleShowPassword={toggleShowPassword}
                passwordStrength={passwordStrength}
              />
            </div>
            <div className="col-12 col-md-6">
              <PasswordField
                label="Confirm Password"
                name="password2"
                value={formData.password2}
                error={errors.password2}
                handleChange={handleChange}
                showPassword={showPassword}
                toggleShowPassword={toggleShowPassword}
              />
            </div>
          </div>

          <button type="submit" className="btn neon-btn w-100 mb-3">
            Register
          </button>

          <p className="text-center" style={{ color: "#1b4332" }}>
            Already have an account?{" "}
            <a href="/api/login" className="text-success fw-bold text-decoration-underline">
              Login
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
