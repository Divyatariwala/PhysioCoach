// Profile.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Download, Upload, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import "../css/Profile.css";

export default function Profile() {
  const backendHost = "http://localhost:8000";
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    age: "",
    gender: "",
    profile_picture: "/static/posture/images/default-avatar.png",
  });

  const [errors, setErrors] = useState({ username: "", age: "", gender: "" });
  const [reports, setReports] = useState([]);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [profilePopupMessage, setProfilePopupMessage] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Get CSRF token from cookie
  const getCSRFToken = () => {
    const name = "csrftoken";
    const cookies = document.cookie.split(";").map(c => c.trim());
    for (let cookie of cookies) {
      if (cookie.startsWith(name + "=")) return decodeURIComponent(cookie.split("=")[1]);
    }
    return null;
  };

  const toggleDropdown = () => setDropdownOpen(prev => !prev);

  const selectGender = (gender) => {
    setProfile(prev => ({ ...prev, gender }));
    setErrors(prev => ({ ...prev, gender: "" }));
    setDropdownOpen(false);
  };

  const mapReports = (apiReports) => (apiReports || []).map(r => ({
    id: r.report_id || r.id,
    title: r.title || "Report",
    date: r.generated_at?.slice(0, 10) || "N/A",
    file_url: r.report_id ? `${backendHost}/api/download_report/${r.report_id}/` : null,
  }));

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`${backendHost}/api/profile/`, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      if (res.status === 401) {
        alert("⚠️ You must be logged in!");
        navigate("/login");
        return;
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      let profilePic = data.profile?.profile_picture || "/static/posture/images/default-avatar.png";
      if (profilePic && !profilePic.startsWith("http")) profilePic = backendHost + profilePic;

      setProfile({
        first_name: data.profile?.first_name || "",
        last_name: data.profile?.last_name || "",
        username: data.profile?.username || "",
        email: data.profile?.email || "",
        age: data.profile?.age ?? "",
        gender: data.profile?.gender ?? "",
        profile_picture: profilePic,
      });

      setReports(mapReports(data.reports));
    } catch (err) {
      console.error(err);
      alert("Unable to fetch profile: " + err.message);
    }
  }, [navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.1, x: 0.5 },
      colors: ["#4CAF50", "#1b4332", "#e0f1e7", "#FFD700"],
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profile_picture", file);

    try {
      const res = await fetch(`${backendHost}/api/update_profile_picture/`, {
        method: "POST",
        body: formData,
        credentials: "include",
        headers: { "X-CSRFToken": getCSRFToken() },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setProfile(prev => ({ ...prev, profile_picture: data.image_url || prev.profile_picture }));
      setProfilePopupMessage("✅ Profile picture updated!");
      setShowProfilePopup(true);
      triggerConfetti();
      setTimeout(() => setShowProfilePopup(false), 8000);
    } catch (err) {
      console.error(err);
      alert("Unable to upload profile picture: " + err.message);
    }
  };

  const handleProfileChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const validateProfile = () => {
    const newErrors = {};
    if (!profile.username || profile.username.trim() === "") newErrors.username = "Username is required";
    if (!profile.age || profile.age === "") newErrors.age = "Age is required";
    if (!profile.gender || profile.gender === "") newErrors.gender = "Gender is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateProfile()) return;

    try {
      const res = await fetch(`${backendHost}/api/update_profile/`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "X-CSRFToken": getCSRFToken() },
        body: JSON.stringify({
          first_name: profile.first_name || null,
          last_name: profile.last_name || null,
          username: profile.username || null,
          age: profile.age || null,
          gender: profile.gender || null,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.success) {
        setProfilePopupMessage("✅ Profile updated successfully!");
        setShowProfilePopup(true);
        triggerConfetti();
        setTimeout(() => setShowProfilePopup(false), 8000);
      } else {
        alert("Failed to update profile: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Unable to update profile: " + err.message);
    }
  };

  const handleDownload = async (reportId) => {
    try {
      const res = await fetch(`${backendHost}/api/download_report/${reportId}/`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to download report");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `report_${reportId}.pdf`;
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setProfilePopupMessage("✅ Report downloaded successfully!");
      setShowProfilePopup(true);
      triggerConfetti();
      setTimeout(() => setShowProfilePopup(false), 8000);
    } catch (err) { console.error(err); }
  };

  return (
    <div className="profile-page position-relative">
      {showProfilePopup && (
        <div className="side-popup show">
          {profilePopupMessage}
          <button id="close_Popup" onClick={() => setShowProfilePopup(false)}>&times;</button>
        </div>
      )}

      <div className="profile-card position-relative">
        <div className="text-center mb-5">
          <div className="avatar-wrapper" onClick={() => fileInputRef.current.click()}>
            <img src={profile.profile_picture} alt="Profile" className="profile-pic" />
            <div className="upload-overlay"><Upload size={64} /></div>
            <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
          </div>
          <h2 className="fw-bold">{profile.username || "Your Profile"}</h2>
        </div>

        <div className="personal-info">
          <h3 className="fw-bold mb-3">Personal Information</h3>
          <div className="info-grid">
            <InputField label="First Name" value={profile.first_name} editable onChange={v => handleProfileChange("first_name", v)} placeholder="Enter your first name" />
            <InputField label="Last Name" value={profile.last_name} editable onChange={v => handleProfileChange("last_name", v)} placeholder="Enter your last name" />
            <InputField label="Username" value={profile.username} editable error={errors.username} onChange={v => handleProfileChange("username", v)} placeholder="Enter your username" />
            <InputField label="Email" value={profile.email} editable={false} />

            <div className="mb-2">
              <label className="form-label fw-semibold">Age</label>
              <input
                type="number"
                value={profile.age || ""}
                onChange={e => handleProfileChange("age", e.target.value)}
                min="18"
                max="100"
                className={`form-control ${errors.age ? "is-invalid" : ""}`}
                placeholder="Enter your age"
              />
              {errors.age && <div className="invalid-feedback">{errors.age}</div>}
            </div>

            <div className="mb-2">
              <label className="form-label fw-semibold">Gender</label>
              <div className="custom-select-wrapper">
                <div className={`custom-select ${errors.gender ? "is-invalid" : ""}`} onClick={toggleDropdown}>
                  {profile.gender || "Select your gender"}
                  <div className={`custom-options ${dropdownOpen ? "show" : ""}`}>
                    {["Male", "Female", "Other"].map(opt => (
                      <div key={opt} className="custom-option" onClick={() => selectGender(opt)}>
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>
                {errors.gender && <div className="invalid-feedback d-block">{errors.gender}</div>}
              </div>
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleSaveProfile}>Save Changes</button>
        </div>

        <div className="reports-section">
          <h3 className="fw-bold mb-3">Your Reports</h3>
          {reports.length > 0 ? (
            <ul>{reports.map(r => (
              <li key={r.id} className="report-item">
                <div><strong>{r.title}</strong><br /><small>Date: {r.date}</small></div>
                <button className="btn btn-success" onClick={() => handleDownload(r.id)}>Download</button>
              </li>
            ))}</ul>
          ) : (
            <div className="no-reports"><Info size={18} /> No reports available</div>
          )}
        </div>

        {/* Change/Forgot Password Button */}
        <div className="change-password-section mt-4 text-center">
          <button className="btn btn-warning" onClick={() => navigate("/api/forgotPassword")}>
            🔒 Change / Forgot Password
          </button>
        </div>
      </div>
    </div>
  );
}

function InputField({ label, value, editable = false, onChange, placeholder = "", error = "" }) {
  return (
    <div className="mb-3">
      <label className="form-label fw-semibold">{label}</label>
      <input
        type="text"
        value={value || ""}
        readOnly={!editable}
        placeholder={placeholder}
        onChange={e => editable && onChange(e.target.value)}
        className={`form-control ${error ? "is-invalid" : ""}`}
      />
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  );
}
