import React, { useState, useEffect, useRef } from "react";
import { Eye, EyeOff } from "lucide-react";
import "../css/ForgotPassword.css";

// PasswordField moved outside to prevent re-creation on each render
const PasswordField = ({
  label,
  name,
  value,
  error,
  showPassword,
  toggleShowPassword,
  handleChange,
  passwordStrength, // NEW
}) => (
  <div className="mb-3 text-start position-relative">
    <label htmlFor={name} className="form-label fw-semibold" style={{ color: "#1b4332" }}>
      {label}
    </label>
    <div style={{ position: "relative" }}>
      <input
        type={showPassword[name] ? "text" : "password"}
        className="form-control neumorphic-input"
        name={name}
        id={name}
        placeholder={label}
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
    {passwordStrength && name === "newPassword" && (
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

const ForgotPassword = () => {
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [popupMessage, setPopupMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [showPassword, setShowPassword] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [passwordChanged, setPasswordChanged] = useState(false); // Show login button
  const [passwordStrength, setPasswordStrength] = useState(""); // NEW

  const canvasRef = useRef(null);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === "newPassword") setPasswordStrength(getPasswordStrength(value));
  };

  const toggleShowPassword = (field) => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.oldPassword) newErrors.oldPassword = "Old password is required";
    if (!formData.newPassword) newErrors.newPassword = "New password is required";
    else if (getPasswordStrength(formData.newPassword) !== "Strong")
      newErrors.newPassword = "Password must be Strong (≥8 chars, uppercase, lowercase, number, special)";
    if (!formData.confirmPassword)
      newErrors.confirmPassword = "Please confirm your new password";
    else if (formData.newPassword !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const csrfToken = document.cookie
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("csrftoken="))
      ?.split("=")[1];

    fetch("http://localhost:8000/api/forgotpassword/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken,
      },
      credentials: "include",
      body: JSON.stringify({
        old_password: formData.oldPassword,
        new_password: formData.newPassword,
        confirm_password: formData.confirmPassword,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.old_password_error) {
          setErrors({ oldPassword: data.old_password_error });
        } else if (data.confirm_password_error) {
          setErrors({ confirmPassword: data.confirm_password_error });
        } else if (data.success_message) {
          setPopupMessage(data.success_message);
          setShowPopup(true);
          setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" });
          setErrors({});
          setPasswordStrength("");
          setPasswordChanged(true); // Show login button
        }
      })
      .catch(() => {
        setPopupMessage("Something went wrong");
        setShowPopup(true);
      });
  };

  useEffect(() => {
    if (showPopup) {
      const timer = setTimeout(() => setShowPopup(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showPopup]);

  // --- Particles Effect ---
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
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = Math.random() * 1 - 0.5;
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

    function initParticles() {
      particlesArray = [];
      for (let i = 0; i < 80; i++) {
        particlesArray.push(new Particle());
      }
    }

    function animateParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesArray.forEach((p) => {
        p.update();
        p.draw();
      });
      requestAnimationFrame(animateParticles);
    }

    initParticles();
    animateParticles();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      className="login-page d-flex justify-content-center align-items-center position-relative"
      style={{ minHeight: "100vh", overflow: "hidden", background: "#e0f1e7" }}
    >
      <canvas ref={canvasRef} id="particles"></canvas>

      <div className="login-card p-5 rounded-4 glass-card position-relative" style={{ zIndex: 1 }}>
        <h2 className="fw-bold mb-4 text-center" style={{ color: "#1b4332" }}>
          Change Password
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
          <PasswordField
            label="Old Password"
            name="oldPassword"
            value={formData.oldPassword}
            error={errors.oldPassword}
            showPassword={showPassword}
            toggleShowPassword={toggleShowPassword}
            handleChange={handleChange}
          />
          <PasswordField
            label="New Password"
            name="newPassword"
            value={formData.newPassword}
            error={errors.newPassword}
            showPassword={showPassword}
            toggleShowPassword={toggleShowPassword}
            handleChange={handleChange}
            passwordStrength={passwordStrength} // NEW
          />
          <PasswordField
            label="Confirm New Password"
            name="confirmPassword"
            value={formData.confirmPassword}
            error={errors.confirmPassword}
            showPassword={showPassword}
            toggleShowPassword={toggleShowPassword}
            handleChange={handleChange}
          />

          <button type="submit" className="btn neon-btn w-100 mb-3">
            Change Password
          </button>

          {/* Login button shown after password change */}
          {passwordChanged && (
            <a href="/login" className="neumorphic-btn">
              Login
            </a>
          )}
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
