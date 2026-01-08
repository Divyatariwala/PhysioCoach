import React, { useState, useEffect, useRef } from "react";
import { Eye, EyeOff } from "lucide-react";
import "../css/ForgotPassword.css";

// Fun Success + Error Messages
const successMessages = [
  "🎉 Password Level Up! You're now more secure than ever!",
  "🛡️ Security boost activated! You're a cyber-ninja now!",
  "✅ Boom! Password changed quicker than a magician disappearing!",
  "🔥 Strong password unlocked! Hackers fear you now!",
  "🚀 Mission accomplished! You're unstoppable!",
];

const errorMessages = {
  oldPassword: [
    "⛔ That old password doesn't ring a bell… try again! 🔑",
    "🤔 Close, but not correct! Double-check your old one!",
  ],
  confirmPassword: [
    "😬 Oops! Those passwords don’t match — like socks from different worlds!",
    "🧩 They must match perfectly — try again!",
  ],
  strength: [
    "💪 Make it stronger! Add symbols, numbers & UPPERCASE!",
    "🔐 Hackers are laughing… give them a challenge!",
  ],
};

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
  <div className="mb-3 text-start position-relative">
    <label
      htmlFor={name}
      className="form-label fw-semibold"
      style={{ color: "#1b4332" }}
    >
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
        <div
          className={`password-strength-text mt-1 ${passwordStrength.toLowerCase()}`}
        >
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
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("");

  const canvasRef = useRef(null);
  const popupRef = useRef(null);

  // Password Strength Logic
  const getPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[@$!%*?&]/.test(password)) strength++;

    if (strength <= 2) return "Weak";
    if (strength <= 4) return "Medium";
    return "Strong";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === "newPassword") {
      setPasswordStrength(getPasswordStrength(value));
    }
  };

  const toggleShowPassword = (field) => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.oldPassword)
      newErrors.oldPassword =
        "Hold up! You can’t change the lock without the old key 🔑";

    if (!formData.newPassword)
      newErrors.newPassword = "A brand-new password needs to be born here 🐣";
    else if (getPasswordStrength(formData.newPassword) !== "Strong")
      newErrors.newPassword =
        errorMessages.strength[Math.floor(Math.random() * 2)];

    if (!formData.confirmPassword)
      newErrors.confirmPassword =
        "Double-check time! Please confirm that password";
    else if (formData.newPassword !== formData.confirmPassword)
      newErrors.confirmPassword =
        errorMessages.confirmPassword[Math.floor(Math.random() * 2)];

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const csrfToken = document.cookie
      .split(";")
      .find((c) => c.trim().startsWith("csrftoken="))
      ?.split("=")[1];

    try {
      const res = await fetch("http://localhost:8000/api/forgotpassword/", {
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
      });

      const data = await res.json();

      if (data.old_password_error) {
        setErrors({
          oldPassword:
            errorMessages.oldPassword[Math.floor(Math.random() * 2)],
        });
      } else if (data.confirm_password_error) {
        setErrors({
          confirmPassword:
            errorMessages.confirmPassword[Math.floor(Math.random() * 2)],
        });
      } else if (data.success_message) {
        setPasswordChanged(true);
        setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" });
        setErrors({});
        setPasswordStrength("");

        const randomSuccess =
          successMessages[Math.floor(Math.random() * successMessages.length)];
        setPopupMessage(randomSuccess);

        // Show popup like Login page
        const popup = popupRef.current;
        if (popup) {
          const popupMsg = popup.querySelector("#popupMessage");
          const closeBtn = popup.querySelector("#closePopup");
          const popupBtn = popup.querySelector("#popupButton");

          popupMsg.textContent = randomSuccess;
          popupBtn.style.display = "none";

          closeBtn.onclick = () => popup.classList.remove("show");
          popup.classList.add("show");
        }

        document.body.classList.add("confetti");
        setTimeout(() => document.body.classList.remove("confetti"), 1800);
      }
    } catch (err) {
      setPopupMessage("Something went wrong.");
      setShowPopup(true);
    }
  };

  useEffect(() => {
    if (showPopup) {
      const timer = setTimeout(() => setShowPopup(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [showPopup]);

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

        <div className="popup" ref={popupRef}>
          <span id="popupMessage" className="fw-semibold"></span>
          <button type="button" id="popupButton" style={{ display: "none" }}></button>
          <button type="button" id="closePopup">&times;</button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <PasswordField
            label="Old Password"
            name="oldPassword"
            value={formData.oldPassword}
            error={errors.oldPassword}
            handleChange={handleChange}
            showPassword={showPassword}
            toggleShowPassword={toggleShowPassword}
          />

          <PasswordField
            label="New Password"
            name="newPassword"
            value={formData.newPassword}
            error={errors.newPassword}
            handleChange={handleChange}
            showPassword={showPassword}
            toggleShowPassword={toggleShowPassword}
            passwordStrength={passwordStrength}
          />

          <PasswordField
            label="Confirm New Password"
            name="confirmPassword"
            value={formData.confirmPassword}
            error={errors.confirmPassword}
            handleChange={handleChange}
            showPassword={showPassword}
            toggleShowPassword={toggleShowPassword}
          />

          <button type="submit" className="btn neon-btn w-100 mb-3">
            Change Password
          </button>

          {passwordChanged && (
            <a href="/api/login" className="neumorphic-btn">
              Login
            </a>
          )}
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
