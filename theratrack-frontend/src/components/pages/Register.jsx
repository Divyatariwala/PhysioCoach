// Register.jsx
import React, { useState } from "react";
import { Eye, EyeOff, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import registerPic from "../../assets/images/Login_pic.png";
import styles from "../css/Register.module.css";

export default function Register() {
  const navigate = useNavigate();

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
  const [showPassword, setShowPassword] = useState({ password1: false, password2: false });
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState(""); // error | success
  const [genderOpen, setGenderOpen] = useState(false);

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

  const showFormPopup = (message, type = "error") => {
    setPopupMessage(message);
    setPopupType(type);
    if (type === "error") {
      setTimeout(() => {
        setPopupMessage("");
        setPopupType("");
      }, 4000);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName) newErrors.firstName = "Please enter your first name 🌿";
    if (!formData.lastName) newErrors.lastName = "Please enter your last name ✨";
    if (!formData.username) newErrors.username = "Pick a cool username!";
    if (!formData.email) newErrors.email = "Please enter your email address 📬";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Invalid email format 📬";
    if (!formData.age) newErrors.age = "Select your age 🌱";
    else if (formData.age < 18) newErrors.age = "🚫 You must be at least 18 years old.";
    else if (formData.age > 120) newErrors.age = "Enter a valid age.";
    if (!formData.gender) newErrors.gender = "Select your gender 🌼";
    if (!formData.password1) newErrors.password1 = "Create a secure password 🔒";
    else if (!isStrongPassword(formData.password1))
      newErrors.password1 = "Make it strong! Use uppercase, lowercase, numbers & symbols 💪";
    if (!formData.password2) newErrors.password2 = "Please confirm your password 🔐";
    else if (formData.password1 !== formData.password2) newErrors.password2 = "Passwords don’t match!";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const response = await fetch("http://localhost:8000/api/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) {
        showFormPopup(data.error || "Registration failed", "error");
      } else {
        showFormPopup("🎉 Registered successfully! Redirecting to login.", "success");
        setTimeout(() => navigate("/api/login"), 1500);
      }
    } catch {
      showFormPopup("Something went wrong. Please try again.", "error");
    }
  };

  const getStrengthColor = (strength, forText = false) => {
    switch (strength) {
      case "Weak": return forText ? "red" : styles.weakBar;
      case "Medium": return forText ? "orange" : styles.mediumBar;
      case "Strong": return forText ? "green" : styles.strongBar;
      default: return forText ? "black" : "";
    }
  };

  return (
    <div className="container-fluid p-0">
      <div className="row g-0">
        {/* LEFT IMAGE */}
        <div className="col-md-5 d-none d-md-block">
          <div className={styles.loginImageSection}>
            <div className={styles.loginPicOverlay}></div>
            <img src={registerPic} alt="Register Illustration" className={styles.loginIllustration} />
            <div className={styles.loginImageText}>
              <h1>Welcome to TheraTrack!</h1>
              <p>Register now to track your therapy sessions and progress.</p>
            </div>
          </div>
        </div>

        {/* RIGHT FORM */}
        <div className="col-md-7 d-flex position-relative justify-content-center align-items-center min-vh-100">
          <div className={styles.formHeader}>
            <button className={styles.backToHomeLink} onClick={() => navigate("/")}>
              <i className="fa-solid fa-arrow-left"></i>{" "}
              <span className={styles.backText}>Back to Home</span>
            </button>
          </div>

          <div className={`${styles.loginFormWrapper} w-100 px-4 px-md-5`} style={{ maxWidth: "550px" }}>
            <h2 className="mb-4 text-center">Create Account</h2>
            {popupMessage && (
              <div className={`${styles.formPopup} ${popupType === "error" ? styles.popupError : styles.popupSuccess}`}>
                {popupMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* First & Last Name */}
              <div className="row mb-3">
                <div className="col">
                  <input
                    type="text"
                    className={`form-control ${errors.firstName ? "is-invalid" : ""}`}
                    placeholder="First Name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                  {errors.firstName && <div className="invalid-feedback d-block">{errors.firstName}</div>}
                </div>
                <div className="col">
                  <input
                    type="text"
                    className={`form-control ${errors.lastName ? "is-invalid" : ""}`}
                    placeholder="Last Name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                  {errors.lastName && <div className="invalid-feedback d-block">{errors.lastName}</div>}
                </div>
              </div>

              {/* Username & Email */}
              <div className="mb-3">
                <input
                  type="text"
                  className={`form-control ${errors.username ? "is-invalid" : ""}`}
                  placeholder="Username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                />
                {errors.username && <div className="invalid-feedback d-block">{errors.username}</div>}
              </div>

              <div className="mb-3">
                <input
                  type="email"
                  className={`form-control ${errors.email ? "is-invalid" : ""}`}
                  placeholder="Email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && <div className="invalid-feedback d-block">{errors.email}</div>}
              </div>

              {/* Age & Gender (custom dropdown) */}
              <div className="row mb-3">
                <div className="col">
                  <input
                    type="number"
                    className={`form-control ${errors.age ? "is-invalid" : ""}`}
                    placeholder="Age"
                    name="age"
                    min="18"
                    max="100"
                    value={formData.age}
                    onChange={handleChange}
                  />
                  {errors.age && <div className="invalid-feedback d-block">{errors.age}</div>}
                </div>

                <div className="col">
                  <div className="mb-3">
                    <div className="dropdown">
                      <button
                        type="button"
                        className={`form-control text-start d-flex justify-content-between align-items-center ${errors.gender ? "is-invalid" : ""}`}
                        onClick={() => setGenderOpen(prev => !prev)}
                      >
                        <span>{formData.gender || "Select Gender"}</span>
                        <ChevronDown
                          size={18}
                          style={{
                            transition: "transform 0.3s",
                            transform: genderOpen ? "rotate(180deg)" : "rotate(0deg)"
                          }}
                        />
                      </button>
                      <div className={`dropdown-menu ${genderOpen ? "show" : ""}`}>
                        {["Male", "Female", "Other"].map((g, idx) => (
                          <button
                            type="button"
                            key={idx}
                            className="dropdown-item"
                            onClick={() => { setFormData(prev => ({ ...prev, gender: g })); setGenderOpen(false); }}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                      {errors.gender && <div className="invalid-feedback d-block">{errors.gender}</div>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Password & Confirm */}
              <div className="row mb-3">
                <div className="col">
                  <div className="input-group flex-column">
                    <div className="d-flex">
                      <input
                        type={showPassword.password1 ? "text" : "password"}
                        className={`form-control ${errors.password1 ? "is-invalid" : ""}`}
                        placeholder="Password"
                        name="password1"
                        value={formData.password1}
                        onChange={handleChange}
                      />
                      <button type="button" className="btn btn-outline-secondary" onClick={() => toggleShowPassword("password1")}>
                        {showPassword.password1 ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {formData.password1 && (
                      <>
                        <small className="mt-1 fw-semibold" style={{ color: getStrengthColor(getPasswordStrength(formData.password1), true) }}>
                          {getPasswordStrength(formData.password1)} password
                        </small>
                        <div className="progress mt-1" style={{ height: "5px", borderRadius: "2px", overflow: "hidden" }}>
                          <div className={`progress-bar ${getStrengthColor(getPasswordStrength(formData.password1))}`}
                               style={{
                                 width: getPasswordStrength(formData.password1) === "Weak" ? "33%" :
                                        getPasswordStrength(formData.password1) === "Medium" ? "66%" : "100%",
                                 transition: "width 0.5s ease-in-out",
                               }}></div>
                        </div>
                      </>
                    )}
                    {errors.password1 && <div className="invalid-feedback d-block">{errors.password1}</div>}
                  </div>
                </div>

                <div className="col">
                  <div className="input-group">
                    <input
                      type={showPassword.password2 ? "text" : "password"}
                      className={`form-control ${errors.password2 ? "is-invalid" : ""}`}
                      placeholder="Confirm Password"
                      name="password2"
                      value={formData.password2}
                      onChange={handleChange}
                    />
                    <button type="button" className="btn btn-outline-secondary" onClick={() => toggleShowPassword("password2")}>
                      {showPassword.password2 ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    {errors.password2 && <div className="invalid-feedback d-block">{errors.password2}</div>}
                  </div>
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-100 mt-2">Register</button>
            </form>

            <div className={`${styles.loginLinks} mt-3 text-center`}>
              Already have an account? <a href="/api/login">Login</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
