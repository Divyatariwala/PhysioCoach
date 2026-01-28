import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import login_pic from "../../assets/images/Login_pic.png";
import styles from "../css/Login.module.css";

export default function Login() {
  const navigate = useNavigate();

  // ---------------- FORM STATE ----------------
  const [formData, setFormData] = useState({ identifier: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // ---------------- FORM POPUP ----------------
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState(""); // error | success

  // ---------------- FORGOT PASSWORD MODAL ----------------
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [otpAttempts, setOtpAttempts] = useState(0);
  const MAX_OTP_ATTEMPTS = 3;
  const [otpTimer, setOtpTimer] = useState(120); // 2 minutes
  const [resendLocked, setResendLocked] = useState(false); // prevent spam resend
  const RESEND_COOLDOWN = 30; // seconds
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [showModalConfirmPassword, setShowModalConfirmPassword] = useState(false);
  const [step, setStep] = useState(1); // 1 = email, 2 = OTP, 3 = new password
  const [forgotOtpSent, setForgotOtpSent] = useState(false);
  const [isFading, setIsFading] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // ---------------- HELPERS ----------------
  const showFormPopup = (message, type = "error") => {
    setPopupMessage(message);
    setPopupType(type);
    setIsFading(false);

    // Start fade out after 3 seconds
    setTimeout(() => {
      setIsFading(true);
    }, 3000);

    // Remove popup completely after fade animation
    setTimeout(() => {
      setPopupMessage("");
      setPopupType("");
      setIsFading(false);
    }, 3600);
  };

  // ---------------- FORM HANDLERS ----------------
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    const value = formData.identifier.trim();

    if (!value) newErrors.identifier = "Username or Email is required!";
    else if (value.includes("@") && !emailRegex.test(value))
      newErrors.identifier = "Invalid email format!";
    if (!formData.password.trim()) newErrors.password = "Password is required!";
    setErrors(newErrors);
    if (Object.keys(newErrors).length) return;

    try {
      const response = await fetch("http://localhost:8000/api/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (data.success) {
        localStorage.setItem("isLoggedIn", "true");
        showFormPopup("Login successful 🎉", "success");
        setTimeout(() => navigate("/home"), 1200);
      } else {
        showFormPopup(data.error || "Login failed", "error");
      }
    } catch {
      showFormPopup("Network error. Please try again.", "error");
    }
  };

  // ---------------- GOOGLE LOGIN ----------------
  const handleGoogleLogin = async (response) => {
    if (!response?.credential) return;
    try {
      const res = await fetch("http://localhost:8000/api/google-login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token: response.credential }),
      });
      const data = await res.json();
      if (data.success) {
        showFormPopup("Google login successful", "success");
        setTimeout(() => navigate("/home"), 1200);
      } else {
        showFormPopup("Google login failed", "error");
      }
    } catch {
      showFormPopup("Google login error", "error");
    }
  };

  useEffect(() => {
    if (!window.google) return;

    window.google.accounts.id.initialize({
      client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
      callback: handleGoogleLogin,
    });
    window.google.accounts.id.renderButton(
      document.getElementById("googleLoginBtn"),
      { theme: "outline", size: "large", width: "100%" }
    );
  }, []);

  // ---------------- OTP TIMER EFFECT ----------------
  useEffect(() => {
    if (step !== 2 || otpTimer <= 0) return;

    const timer = setInterval(() => {
      setOtpTimer(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [step, otpTimer]);

  // ---------------- FORGOT PASSWORD ----------------
  const handleSendOTP = async () => {
    if (!emailRegex.test(forgotEmail)) {
      showFormPopup("Please enter a valid email", "error");
      return;
    }
    try {
      const res = await fetch("http://localhost:8000/api/send-otp/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();

      if (data.success) {
        setForgotOtpSent(true);
        setStep(2);
        setOtpTimer(120);
        setOtpAttempts(0);
        showFormPopup("OTP has been sent to your email 📩", "success");
      } else {
        showFormPopup(data.error || "Failed to send OTP", "error");
      }
    } catch {
      showFormPopup("Network error. Please try again.", "error");
    }
  };

  const handleVerifyOTP = async () => {
    if (otpTimer <= 0) {
      showFormPopup("OTP expired. Please resend OTP.", "error");
      return;
    }

    if (otpAttempts >= MAX_OTP_ATTEMPTS) {
      showFormPopup("Too many wrong attempts. Please resend OTP.", "error");
      return;
    }
    const enteredOtp = otp.join("");

    try {
      const res = await fetch("http://localhost:8000/api/verify-otp/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, otp: enteredOtp }),
      });
      const data = await res.json();

      if (data.success) {
        setStep(3);
        setOtpAttempts(0); // reset attempts
        showFormPopup("OTP verified ✅", "success");
      } else {
        setOtpAttempts(prev => prev + 1);
        showFormPopup(
          `Invalid OTP. Attempts left: ${MAX_OTP_ATTEMPTS - (otpAttempts + 1)}`,
          "error"
        );
      }
    } catch {
      showFormPopup("Network error. Please try again.", "error");
    }
  };

  const handleOtpChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next box automatically
    if (value && index < 3) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus();
    }
  };

  const handleResendOTP = async () => {
    if (!emailRegex.test(forgotEmail)) {
      showFormPopup("Please enter a valid email", "error");
      return;
    }

    if (resendLocked) {
      showFormPopup(`Please wait ${RESEND_COOLDOWN} seconds before resending`, "error");
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/api/send-otp/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await res.json();

      if (data.success) {
        setOtp(["", "", "", ""]); // clear old OTP
        setOtpAttempts(0); // reset attempts
        setOtpTimer(120); // reset timer
        setResendLocked(true); // lock resend for cooldown
        showFormPopup("OTP resent successfully 📩", "success");

        // unlock resend after cooldown
        setTimeout(() => setResendLocked(false), RESEND_COOLDOWN * 1000);
      } else {
        showFormPopup(data.error || "Failed to resend OTP", "error");
      }
    } catch {
      showFormPopup("Network error. Please try again.", "error");
    }
  };



  // ---------------- PASSWORD STRENGTH ----------------
  const getPasswordStrength = (password) => {
    if (!password) return "";
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

  const getStrengthColor = (strength, forText = false) => {
    switch (strength) {
      case "Weak":
        return forText ? "red" : styles.weakBar;
      case "Medium":
        return forText ? "orange" : styles.mediumBar;
      case "Strong":
        return forText ? "green" : styles.strongBar;
      default:
        return forText ? "black" : "";
    }
  };


  const handleResetPassword = async () => {
  const trimmedEmail = forgotEmail.trim().toLowerCase();
  const enteredOtp = otp.map(d => (d ? d.trim() : "")).join("");
  const trimmedNewPassword = newPassword.trim();
  const trimmedConfirmPassword = confirmPassword.trim();

  if (!trimmedEmail || !enteredOtp || !trimmedNewPassword || !trimmedConfirmPassword) {
    showFormPopup("All fields are required!", "error");
    return;
  }

  if (enteredOtp.length !== 4) {
    showFormPopup("Please enter the 4-digit OTP", "error");
    return;
  }

  if (trimmedNewPassword !== trimmedConfirmPassword) {
    showFormPopup("Passwords do not match", "error");
    return;
  }

  try {
    const res = await fetch("http://localhost:8000/api/reset-password/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: trimmedEmail,
        otp: enteredOtp,
        new_password: trimmedNewPassword,
        confirm_password: trimmedConfirmPassword,
      }),
    });

    const data = await res.json();

    if (data.success) {
      showFormPopup("Password reset successful ✅", "success");
      setShowForgotModal(false);
      setStep(1);
      setForgotEmail("");
      setOtp(["", "", "", ""]);
      setNewPassword("");
      setConfirmPassword("");
      setForgotOtpSent(false);
    } else {
      showFormPopup(data.error || "Password reset failed", "error");
    }
  } catch {
    showFormPopup("Network error. Please try again.", "error");
  }
};


  return (
    <div className="container-fluid p-0">
      <div className="row g-0">
        {/* LEFT IMAGE */}
        <div className="col-md-5 d-none d-md-block">
          <div className={styles.loginImageSection}>
            <div className={styles.loginPicOverlay}></div>
            <img src={login_pic} alt="Login" className={styles.loginIllustration} />
            <div className={styles.loginImageText}>
              <h1>Welcome Back!</h1>
              <p>Track your therapy sessions and progress seamlessly.</p>
            </div>
          </div>
        </div>

        {/* RIGHT FORM */}
        <div className="col-md-7 position-relative d-flex justify-content-center align-items-center min-vh-100">
          <div className={styles.formHeader}>
            <button className={styles.backToHomeLink} onClick={() => navigate("/")}>
              <i className="fa-solid fa-arrow-left"></i>{" "}
              <span className={styles.backText}>Back to Home</span>
            </button>
          </div>

          <div className={`${styles.loginFormWrapper} w-100 px-4`}>
            <h2 className="text-center mb-4">TheraTrack Login</h2>

            {popupMessage && (
              <div
                className={`
      ${styles.formPopup}
      ${popupType === "error" ? styles.popupError : styles.popupSuccess}
      ${isFading ? styles.hidePopup : styles.showPopup}
    `}
              >
                {popupMessage}
              </div>
            )}



            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label>Username or Email</label>
                <input
                  type="text"
                  name="identifier"
                  className={`form-control ${errors.identifier ? "is-invalid" : ""}`}
                  value={formData.identifier}
                  onChange={handleChange}
                />
                {errors.identifier && (
                  <div className="invalid-feedback d-block">{errors.identifier}</div>
                )}
              </div>

              <div className="mb-3">
                <label>Password</label>
                <div className="input-group">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    className={`form-control ${errors.password ? "is-invalid" : ""}`}
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i
                      className={showPassword ? "fa-regular fa-eye-slash" : "fa-regular fa-eye"}
                    ></i>
                  </button>
                </div>
                {errors.password && (
                  <div className="invalid-feedback d-block">{errors.password}</div>
                )}
              </div>

              <button type="submit" className="btn btn-primary w-100" style={{ fontWeight: 600 }}>
                Login
              </button>
            </form>

            <div className="mt-3" id="googleLoginBtn"></div>

            <div className={styles.loginLinks}>
              <span>
                Don't have an account? <a href="/api/register">Sign up</a>
              </span>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setShowForgotModal(true);
                  setStep(1);
                }}
              >
                Forgot Password?
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      {showForgotModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.forgotModal}>
            <button
              className={styles.modalClose}
              onClick={() => {
                setShowForgotModal(false);
                setStep(1);
                setForgotEmail("");
                setOtp(["", "", "", ""]);
                setNewPassword("");
                setConfirmPassword("");
                setShowModalPassword(false);
                setShowModalConfirmPassword(false);
              }}
            >
              &times;
            </button>

            <h3 className={styles.modalTitle}>Forgot Password</h3>

            {/* MODAL POPUP INSIDE */}
            {popupMessage && (
              <div
                className={`
      ${styles.formPopup}
      ${popupType === "error" ? styles.popupError : styles.popupSuccess}
      ${isFading ? styles.hidePopup : styles.showPopup}
    `}
              >
                {popupMessage}
              </div>
            )}



            {step === 1 && (
              <>
                <input
                  type="email"
                  placeholder="Email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className={styles.modalInput}
                />
                <button className={styles.modalButton} onClick={handleSendOTP}>
                  Send OTP
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="d-flex justify-content-center gap-2 mb-3">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handleOtpChange(e.target.value, index)}
                      onKeyDown={(e) => handleOtpKeyDown(e, index)}
                      className={styles.otpBox}
                      disabled={otpAttempts >= MAX_OTP_ATTEMPTS || otpTimer <= 0} // lock on attempts or expiry
                    />
                  ))}
                </div>

                {otpTimer > 0 ? (
                  <small className="text-muted text-center d-block" style={{ paddingBottom: "3px"}}>
                    OTP expires in {Math.floor(otpTimer / 60)}:
                    {(otpTimer % 60).toString().padStart(2, "0")}
                  </small>
                ) : (
                  <small className="text-danger text-center d-block" style={{ paddingBottom: "3px" }}>
                    OTP expired
                  </small>
                )}

                <button
                  className={styles.modalButton}
                  onClick={handleVerifyOTP}
                  disabled={otpAttempts >= MAX_OTP_ATTEMPTS || otpTimer <= 0}
                >
                  Verify code
                </button>

                {/* Small Resend Link */}
                <div className="text-center">
                  <span
                    className={`${styles.resendOtpLink} ${resendLocked ? styles.disabled : ""}`}
                    onClick={() => !resendLocked && handleResendOTP()}
                  >
                    {resendLocked ? `Resend in ${RESEND_COOLDOWN}s` : "Resend OTP"}
                  </span>
                </div>
{/* //link colour */}
              </>
            )}


            {step === 3 && (
              <>
                {/* NEW PASSWORD FIELD */}
                <div className="input-group flex-column mb-2">
                  <div className="d-flex">
                    <input
                      type={showModalPassword ? "text" : "password"}
                      placeholder="New Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="form-control"
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowModalPassword(!showModalPassword)}
                    >
                      <i className={showModalPassword ? "fa-regular fa-eye-slash" : "fa-regular fa-eye"}></i>
                    </button>
                  </div>

                  {/* Strength Meter */}
                  {newPassword && (
                    <>
                      <small
                        className="mt-1 fw-semibold"
                        style={{ color: getStrengthColor(getPasswordStrength(newPassword), true) }}
                      >
                        {getPasswordStrength(newPassword)} password
                      </small>
                      <div className="progress mt-1" style={{ height: "5px", borderRadius: "2px", overflow: "hidden" }}>
                        <div
                          className={`progress-bar ${getStrengthColor(getPasswordStrength(newPassword))}`}
                          role="progressbar"
                          style={{
                            width:
                              getPasswordStrength(newPassword) === "Weak"
                                ? "33%"
                                : getPasswordStrength(newPassword) === "Medium"
                                  ? "66%"
                                  : "100%",
                            transition: "width 0.5s ease-in-out",
                          }}
                        ></div>
                      </div>
                    </>
                  )}
                </div>

                {/* CONFIRM PASSWORD FIELD */}
                <div className="input-group flex-column mb-3">
                  <div className="d-flex">
                    <input
                      type={showModalConfirmPassword ? "text" : "password"}
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="form-control"
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowModalConfirmPassword(!showModalConfirmPassword)}
                    >
                      <i className={showModalConfirmPassword ? "fa-regular fa-eye-slash" : "fa-regular fa-eye"}></i>
                    </button>
                  </div>

                  {/* Optional: Confirm password matches new password */}
                  {confirmPassword && (
                    <small
                      className="mt-1 fw-semibold"
                      style={{ color: newPassword === confirmPassword ? "green" : "red" }}
                    >
                      {newPassword === confirmPassword ? "Passwords match ✅" : "Passwords do not match ❌"}
                    </small>
                  )}
                </div>

                <button className={styles.modalButton} onClick={handleResetPassword}>
                  Reset Password
                </button>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
}