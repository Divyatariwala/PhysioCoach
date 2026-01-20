// Profile.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Download, Upload, ChevronDown } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import picture from "../../assets/images/about&profile.png";
import defaultAvatar from "../../assets/images/default-avatar.png";
import confetti from "canvas-confetti";
import styles from "../css/Profile.module.css";

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
    profile_picture: defaultAvatar,
  });

  const [errors, setErrors] = useState({ username: "", age: "", gender: "" });
  const [reports, setReports] = useState([]);
  const [exerciseTypes, setExerciseTypes] = useState([]);
  const [filterType, setFilterType] = useState("");

  // ---------- Profile Popups ----------
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [profilePopupMessage, setProfilePopupMessage] = useState("");
  const [profilePopupType, setProfilePopupType] = useState("success");

  // ---------- Report Popups ----------
  const [showReportPopup, setShowReportPopup] = useState(false);
  const [reportPopupMessage, setReportPopupMessage] = useState("");
  const [reportPopupType, setReportPopupType] = useState("success");

  // Dropdown state
  const [genderOpen, setGenderOpen] = useState(false);

  // ---------------- CSRF ----------------
  const getCSRFToken = () => {
    const name = "csrftoken";
    const cookies = document.cookie.split(";").map(c => c.trim());
    for (let cookie of cookies) {
      if (cookie.startsWith(name + "=")) return decodeURIComponent(cookie.split("=")[1]);
    }
    return null;
  };

  // ---------------- Popups ----------------
  const showProfilePopupMessage = (message, type = "success") => {
    setProfilePopupMessage(message);
    setProfilePopupType(type);
    setShowProfilePopup(true);
    setTimeout(() => setShowProfilePopup(false), 4000);
  };

  const showReportPopupMessage = (message, type = "success") => {
    setReportPopupMessage(message);
    setReportPopupType(type);
    setShowReportPopup(true);
    setTimeout(() => setShowReportPopup(false), 4000);
  };

  // ---------------- Map API reports ----------------
  const mapReports = (apiReports) => (apiReports || []).map(r => ({
    id: r.report_id || r.id,
    title: r.title || "Report",
    date: r.generated_at?.slice(0, 10) || "N/A",
    type: r.exercise?.name || "Unknown",
  }));

  // ---------------- Fetch Profile ----------------
  const fetchProfile = useCallback(async () => {
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

      let profilePic = data.profile?.profile_picture
        ? data.profile.profile_picture.startsWith("http")
          ? data.profile.profile_picture
          : backendHost + data.profile.profile_picture
        : defaultAvatar;

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
      setExerciseTypes((data.exercises || []).map(ex => ex.name).filter(Boolean));
    } catch (err) {
      console.error(err);
      alert("Unable to fetch profile: " + err.message);
    }
  }, [navigate]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // ---------------- Confetti ----------------
  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.1, x: 0.5 },
      colors: ["#4CAF50", "#1b4332", "#e0f1e7", "#FFD700"],
    });
  };

  // ---------------- File Upload ----------------
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
      showProfilePopupMessage("✅ Profile picture updated!");
      triggerConfetti();
    } catch (err) {
      console.error(err);
      alert("Unable to upload profile picture: " + err.message);
    }
  };

  // ---------------- Profile Change ----------------
  const handleProfileChange = (field, value) => {
    if (field === "age") {
      let num = parseInt(value, 10);
      if (isNaN(num)) num = "";
      else if (num < 18) num = 18;
      else if (num > 100) num = 100;
      setProfile(prev => ({ ...prev, age: num }));
      setErrors(prev => ({ ...prev, age: "" }));
    } else {
      setProfile(prev => ({ ...prev, [field]: value }));
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateProfile = () => {
    const newErrors = {};
    if (!profile.username?.trim()) newErrors.username = "Username is required";
    if (!profile.age) newErrors.age = "Age is required";
    if (!profile.gender) newErrors.gender = "Gender is required";
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
        showProfilePopupMessage("✅ Profile updated successfully!");
        triggerConfetti();
      } else {
        alert("Failed to update profile: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Unable to update profile: " + err.message);
    }
  };

  // ---------------- Download Report ----------------
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
      showReportPopupMessage("✅ Report downloaded successfully!");
      triggerConfetti();
    } catch (err) { console.error(err); }
  };

  const filteredReports = reports.filter(r => {
    if (!filterType) return true;
    return r.type === filterType;
  });

  return (
    <>
      {/* Banner Section */}
      <section className={styles.profileSection}>
        <div className="container-fluid p-0 position-relative">
          <div className={styles.imageOverlay}></div>
          <img src={picture} alt="TheraTrack profile" className={styles.profileImage} />
          <div className={styles.profileContent}>
            <h1>Profile</h1>
            <p><Link to="/" className={styles.breadcrumbLink}>Home</Link> / <span>Profile</span></p>
          </div>
        </div>
      </section>

      {/* Profile Form Section */}
      <section className={styles.formSection}>
        <div className="container my-4">

          {/* Avatar + Username + Email */}
          <div className="d-flex align-items-center mb-4 pl-2 position-relative">
            <div className={styles.avatarWrapper} onClick={() => fileInputRef.current.click()}>
              <div className={styles.avatarCircle}>
                <img
                  src={profile.profile_picture || defaultAvatar}
                  onError={e => e.currentTarget.src = defaultAvatar}
                  alt="Profile"
                  className={styles.avatar}
                />
                <div className={styles.uploadOverlay}>
                  <Upload size={24} color="#fff" />
                </div>
              </div>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="d-none"
                onChange={handleFileChange}
              />
            </div>
            <div className="ms-5">
              <h2>{profile.username}</h2>
              <p>{profile.email}</p>
            </div>

            {/* Profile Popup near username/email */}
            {showProfilePopup && (
              <div className={`${styles.profilePopup} ${profilePopupType === "success" ? styles.popupSuccess : styles.popupError}`}>
                {profilePopupMessage}
              </div>
            )}
          </div>

          {/* Personal Info Form */}
          <div className="d-flex justify-content-between pt-2">
            <h3 className="mb-4">Personal Information</h3>
            <button className={`btn btn-primary ${styles.customBtn}`} onClick={handleSaveProfile}>Save Changes</button>
          </div>

          <div className={styles.profileFormSection}>
            <div className="row g-3 pl-2">
              {/* First Name */}
              <div className="col-md-6">
                <InputField
                  label="First Name"
                  value={profile.first_name}
                  onChange={v => handleProfileChange("first_name", v)}
                  className={styles.customInput}
                />
              </div>

              {/* Last Name */}
              <div className="col-md-6">
                <InputField
                  label="Last Name"
                  value={profile.last_name}
                  onChange={v => handleProfileChange("last_name", v)}
                  className={styles.customInput}
                />
              </div>

              {/* Username */}
              <div className="col-md-6">
                <InputField
                  label="Username"
                  value={profile.username}
                  editable
                  onChange={v => handleProfileChange("username", v)}
                  error={errors.username}
                  className={styles.customInput}
                />
              </div>

              {/* Email */}
              <div className="col-md-6">
                <InputField
                  label="Email"
                  value={profile.email}
                  editable={false}
                  className={styles.customInput}
                />
              </div>

              {/* Age */}
              <div className="col-md-6">
                <InputField
                  label="Age"
                  value={profile.age}
                  editable
                  onChange={v => handleProfileChange("age", v)}
                  error={errors.age}
                  type="number"
                  min={18}
                  max={100}
                  className={styles.customInput}
                />
              </div>

              {/* Gender Dropdown */}
              <div className="col-md-6">
                <InputFieldDropdown
                  label="Gender"
                  value={profile.gender}
                  options={["Male", "Female", "Other"]}
                  onSelect={v => handleProfileChange("gender", v)}
                  error={errors.gender}
                  className={styles.customInput}
                />
              </div>
            </div>
          </div>

          {/* Reports Section */}
          <div className={styles.reportsSection}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h3>Your Reports</h3>

              {/* Report Popup near heading */}
              {showReportPopup && (
                <div className={`${styles.reportPopup} ${reportPopupType === "success" ? styles.popupSuccess : styles.popupError}`}>
                  {reportPopupMessage}
                </div>
              )}
            </div>

            {/* Exercise Filter */}
            <div className="d-flex align-items-center gap-3 mt-2">
              <label className="fw-semibold mb-0">Filter by Exercise:</label>
              <div style={{ minWidth: "200px" }}>
                <InputFieldDropdown
                  label=""
                  value={filterType || "All Exercises"}
                  options={["All Exercises", ...exerciseTypes]}
                  onSelect={v => setFilterType(v === "All Exercises" ? "" : v)}
                  className="form-control mt-3"
                />
              </div>
            </div>

            {filteredReports.length === 0 ? <p className="p-0">No reports available.</p> : (
              <div className="list-group">
                {filteredReports.map(r => (
                  <div key={r.id} className={`list-group-item d-flex p-0 justify-content-between align-items-center ${styles.reportItem}`}>
                    <div>
                      <h5>{r.title}</h5>
                      <small>Date: {r.date}</small>
                      <small className="ms-2">Type: {r.type}</small>
                    </div>
                    <button className="btn btn-outline-primary" onClick={() => handleDownload(r.id)}>
                      <Download size={16} className="me-2 icon" /> Download
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

// ---------------- InputField ----------------
function InputField({ label, value, editable = true, onChange, placeholder = "", error = "", type = "text", min, max, className = "" }) {
  return (
    <div className="mb-1">
      <label className="form-label fw-semibold">{label}</label>
      <input
        type={type}
        value={value || ""}
        readOnly={!editable}
        placeholder={placeholder}
        min={min}
        max={max}
        onChange={e => editable && onChange(e.target.value)}
        className={`form-control ${error ? "is-invalid" : ""} ${className}`}
      />
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  );
}

// ---------------- InputFieldDropdown ----------------
function InputFieldDropdown({ label, value, options, onSelect, error, className = "" }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-3 position-relative">
      {label && <label className="form-label fw-semibold">{label}</label>}
      <div className="dropdown">
        <button
          type="button"
          className={`form-control text-start d-flex justify-content-between align-items-center ${error ? "is-invalid" : ""} ${className}`}
          onClick={() => setOpen(prev => !prev)}
        >
          <span>{value || (label ? "Select " + label : "Select")}</span>
          <ChevronDown size={18} style={{ transition: "transform 0.3s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
        </button>
        <div className={`dropdown-menu ${open ? "show" : ""}`}>
          {options.map((opt, idx) => (
            <button key={`${opt}-${idx}`} type="button" className="dropdown-item" onClick={() => { onSelect(opt); setOpen(false); }}>
              {opt}
            </button>
          ))}
        </div>
      </div>
      {error && <div className="invalid-feedback d-block">{error}</div>}
    </div>
  );
}
