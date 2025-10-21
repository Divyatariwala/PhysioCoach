import React, { useState, useEffect, useRef } from "react";
import "../css/ForgotPassword.css";

const ForgotPassword = ({ successMessage = "" }) => {
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [popupMessage, setPopupMessage] = useState(successMessage);
  const [showPopup, setShowPopup] = useState(!!successMessage);
  const canvasRef = useRef(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.oldPassword) newErrors.oldPassword = "Old password is required";
    if (!formData.newPassword) newErrors.newPassword = "New password is required";
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

    fetch("/ForgotPassword", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })
      .then((res) => res.json())
      .then((data) => {
        setPopupMessage(data.message || "Password changed successfully!");
        setShowPopup(true);
        if (data.success) setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" });
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

  // --- Particles Logic ---
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
    <div className="login-page d-flex justify-content-center align-items-center position-relative" style={{ minHeight: "100vh", overflow: "hidden", background: "#e0f1e7" }}>
      {/* Particles Canvas */}
      <canvas ref={canvasRef} id="particles"></canvas>

      <div className="login-card p-5 rounded-4 glass-card position-relative" style={{ zIndex: 1 }}>
        <h2 className="fw-bold mb-4 text-center" style={{ color: "#1b4332" }}>Change Password</h2>

        {showPopup && (
          <div className="popup show">
            <span className="fw-semibold">{popupMessage}</span>
            <button id="closePopup" onClick={() => setShowPopup(false)}>&times;</button>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3 text-start">
            <label htmlFor="oldPassword" className="form-label fw-semibold" style={{ color: "#1b4332" }}>Old Password</label>
            <input type="password" className="form-control neumorphic-input" name="oldPassword" id="oldPassword" placeholder="Enter your old password" value={formData.oldPassword} onChange={handleChange} />
            {errors.oldPassword && <div className="form-error">{errors.oldPassword}</div>}
          </div>

          <div className="mb-3 text-start">
            <label htmlFor="newPassword" className="form-label fw-semibold" style={{ color: "#1b4332" }}>New Password</label>
            <input type="password" className="form-control neumorphic-input" name="newPassword" id="newPassword" placeholder="Enter new password" value={formData.newPassword} onChange={handleChange} />
            {errors.newPassword && <div className="form-error">{errors.newPassword}</div>}
          </div>

          <div className="mb-3 text-start">
            <label htmlFor="confirmPassword" className="form-label fw-semibold" style={{ color: "#1b4332" }}>Confirm New Password</label>
            <input type="password" className="form-control neumorphic-input" name="confirmPassword" id="confirmPassword" placeholder="Confirm new password" value={formData.confirmPassword} onChange={handleChange} />
            {errors.confirmPassword && <div className="form-error">{errors.confirmPassword}</div>}
          </div>

          <button type="submit" className="btn neon-btn w-100 mb-3">Change Password</button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
