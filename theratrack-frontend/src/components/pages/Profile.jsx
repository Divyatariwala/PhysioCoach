import React, { useState, useEffect, useRef, useCallback } from "react";
import { Download, Upload, Info, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import confetti from "canvas-confetti";
import "../css/Profile.css";

export default function Profile() {
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    age: "",
    gender: "",
    profile_picture: "/static/posture/images/default-avatar.png",
  });

  const [reports, setReports] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState("all");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [profilePopupMessage, setProfilePopupMessage] = useState("");
  const [showReportPopup, setShowReportPopup] = useState(false);
  const [reportPopupMessage, setReportPopupMessage] = useState("");

  const fileInputRef = useRef(null);
  const backendHost = "http://localhost:8000";

  const getCSRFToken = () => {
    const name = "csrftoken";
    const cookies = document.cookie.split(";").map((c) => c.trim());
    for (let cookie of cookies) {
      if (cookie.startsWith(name + "="))
        return decodeURIComponent(cookie.split("=")[1]);
    }
    return null;
  };

  const mapReports = (apiReports) =>
    (apiReports || []).map((r) => {
      const id = r.report_id || r.id;
      return {
        id,
        title: r.title || "Report",
        date: r.generated_at?.slice(0, 10) || "N/A",
        file_url: id ? `${backendHost}/api/download_report/${id}/` : null,
      };
    });

  // --- fetchData wrapped in useCallback ---
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`${backendHost}/api/profile/`, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) throw new Error("Failed to fetch profile");

      const data = await res.json();

      let profilePic =
        data.profile?.profile_picture ||
        "/static/posture/images/default-avatar.png";
      if (profilePic && !profilePic.startsWith("http"))
        profilePic = backendHost + profilePic;

      setProfile({ ...data.profile, profile_picture: profilePic });
      setReports(mapReports(data.reports));
      setExercises(data.exercises || []);
    } catch (err) {
      console.error("🚨 Profile load error:", err);
      alert("⚠️ Please log in to view your profile.");
      window.location.href = "/login";
    }
  }, [backendHost]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.1, x: 0.5 },
      colors: ["#4CAF50", "#1b4332", "#e0f1e7", "#FFD700"],
    });
    confetti({
      particleCount: 100,
      angle: 60,
      spread: 60,
      origin: { x: 0 },
      colors: ["#4CAF50", "#1b4332", "#e0f1e7", "#FFD700"],
    });
    confetti({
      particleCount: 100,
      angle: 120,
      spread: 60,
      origin: { x: 1 },
      colors: ["#4CAF50", "#1b4332", "#e0f1e7", "#FFD700"],
    });
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profile_picture", file);

    try {
      const csrfToken = getCSRFToken();

      const res = await fetch(`${backendHost}/api/update_profile_picture/`, {
        method: "POST",
        body: formData,
        credentials: "include",
        headers: { "X-CSRFToken": csrfToken },
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();

      let newPic =
        data.image_url || "/static/posture/images/default-avatar.png";
      if (newPic && !newPic.startsWith("http")) newPic = backendHost + newPic;

      setProfile((prev) => ({ ...prev, profile_picture: newPic }));

      setProfilePopupMessage("Profile picture updated!");
      setShowProfilePopup(true);
      triggerConfetti();
      setTimeout(() => setShowProfilePopup(false), 8000);
    } catch (err) {
      console.error(err);
      alert("Unable to upload profile picture");
    }
  };

  const handleExerciseSelect = async (exerciseId) => {
    setSelectedExercise(exerciseId);
    setDropdownOpen(false);

    try {
      const url =
        exerciseId === "all"
          ? `${backendHost}/api/filter_reports/`
          : `${backendHost}/api/filter_reports/?exercise_id=${exerciseId}`;

      const res = await fetch(url, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) throw new Error("Failed to fetch reports");

      const data = await res.json();
      setReports(mapReports(data.reports));
    } catch (err) {
      console.error(err);
      alert("⚠️ Failed to fetch reports");
      setReports([]);
    }
  };

  const handleDownload = async (reportId) => {
    try {
      const response = await fetch(
        `${backendHost}/api/download_report/${reportId}/`,
        { method: "GET", credentials: "include" }
      );

      if (!response.ok)
        throw new Error(`Failed to download report: ${response.status}`);

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `report_${reportId}.pdf`;
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setReportPopupMessage("✅ Report downloaded successfully!");
      setShowReportPopup(true);
      triggerConfetti();
      setTimeout(() => setShowReportPopup(false), 8000);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  return (
    <div className="profile-page position-relative">
      <div className="profile-card position-relative">
        {showProfilePopup && (
          <div className="side-popup show">
            {profilePopupMessage}
            <button id="closePopup" onClick={() => setShowProfilePopup(false)}>
              &times;
            </button>
          </div>
        )}

        <div className="text-center mb-5">
          <div
            className="avatar-wrapper"
            onClick={() => fileInputRef.current.click()}
          >
            <img
              src={profile.profile_picture}
              alt="Profile"
              className="profile-pic"
            />
            <div className="upload-overlay">
              <Upload size={64} />
            </div>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          <h2 className="fw-bold" style={{ color: "#1b4332" }}>
            {profile.username}'s Profile
          </h2>
        </div>

        <div className="personal-info">
          <h3 className="fw-bold mb-3" style={{ color: "#1b4332" }}>
            Personal Information
          </h3>
          <div className="info-grid">
            <InputField label="First Name" value={profile.first_name} />
            <InputField label="Last Name" value={profile.last_name} />
            <InputField label="Username" value={profile.username} />
            <InputField label="Email" value={profile.email} />
            <InputField label="Age" value={profile.age} />
            <InputField label="Gender" value={profile.gender} />
          </div>
        </div>

        <div className="custom-dropdown">
          <label className="fw-semibold mb-2 text-dark">
            Filter Reports by Exercise:
          </label>
          <div
            className="dropdown-trigger"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            {exercises.find((ex) => ex.exercise_id === selectedExercise)?.name ??
              "All Exercises"}
          </div>
          {dropdownOpen && (
            <div className="dropdown-options show">
              <div onClick={() => handleExerciseSelect("all")}>All Exercises</div>
              {exercises.map((ex) => (
                <div
                  key={ex.exercise_id}
                  onClick={() => handleExerciseSelect(ex.exercise_id)}
                >
                  {ex.name}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="reports-section position-relative">
          <h3 className="fw-bold mb-3" style={{ color: "#1b4332" }}>
            Your Reports
          </h3>

          {showReportPopup && (
            <div className="report-popup show">
              {reportPopupMessage}
              <button id="closePopup" onClick={() => setShowReportPopup(false)}>
                &times;
              </button>
            </div>
          )}

          {reports.length > 0 ? (
            <ul>
              {reports.map((report) => (
                <li key={report.id} className="report-item">
                  <div>
                    <strong>{report.title}</strong>
                    <br />
                    <small className="text-muted">Date: {report.date}</small>
                  </div>
                  <button
                    className="btn btn-success"
                    onClick={() => handleDownload(report.id)}
                    disabled={!report.file_url}
                  >
                    <Download size={18} /> Download
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="no-reports">
              <Info size={18} /> No reports available for this exercise.
            </div>
          )}
        </div>

        <div className="forgot-password">
          <Link to="/api/forgotpassword">
            <Lock size={18} /> Forgot / Change Password
          </Link>
        </div>
      </div>
    </div>
  );
}

function InputField({ label, value }) {
  return (
    <div>
      <label className="form-label fw-semibold">{label}</label>
      <input type="text" value={value || ""} readOnly />
    </div>
  );
}
