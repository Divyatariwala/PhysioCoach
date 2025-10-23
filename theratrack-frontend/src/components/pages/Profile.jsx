import React, { useState, useEffect, useRef } from "react";
import { Download, Upload, Info, Lock } from "lucide-react";
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
  const fileInputRef = useRef(null);

  // ✅ Fetch profile + exercises + reports
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/profile_api/", {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          // Redirected to login -> HTML response
          throw new Error("Not authenticated");
        }

        const contentType = res.headers.get("content-type");
        if (!contentType?.includes("application/json")) {
          throw new Error("Received non-JSON response (likely login page)");
        }

        const data = await res.json();
        setProfile(data.profile || {});
        setReports(data.reports || []);
        setExercises(data.exercises || []);
      } catch (err) {
        console.error("Profile load error:", err);
        alert("⚠️ Please log in to view your profile.");
        window.location.href = "/login"; // ✅ auto redirect
      }
    };

    fetchData();
  }, []);

  // ✅ Upload Profile Picture
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profile_picture", file);

    try {
      const res = await fetch("/api/update_profile_picture_api/", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) throw new Error("Upload Failed");

      const data = await res.json();
      setProfile((prev) => ({
        ...prev,
        profile_picture: data.image_url,
      }));
    } catch (err) {
      console.error(err);
      alert("⚠️ Unable to upload profile picture");
    }
  };

  // ✅ Filter Reports
  const handleExerciseSelect = async (exerciseId) => {
    setSelectedExercise(exerciseId);
    setDropdownOpen(false);

    try {
      const res = await fetch(
        `/api/filter_reports_api/?exercise_id=${exerciseId}`,
        { credentials: "include" }
      );

      if (!res.ok) throw new Error("Failed to fetch reports");

      const data = await res.json();
      setReports(data.reports || []);
    } catch (err) {
      console.error(err);
      alert("⚠️ Failed to filter reports");
    }
  };

  // ✅ Download
  const handleDownload = (url) => {
    if (url) window.open(url, "_blank");
  };

  return (
    <div className="profile-page">
      <div className="profile-card">
        {/* ✅ Avatar + Upload */}
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

        {/* ✅ Personal Info */}
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

        {/* ✅ Dropdown Filter */}
        <div className="custom-dropdown">
          <label className="fw-semibold mb-2 text-dark">
            Filter Reports by Exercise:
          </label>
          <div
            className="dropdown-trigger"
            onClick={() => setDropdownOpen((v) => !v)}
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

        {/* ✅ Reports Section */}
        <div className="reports-section">
          <h3 className="fw-bold mb-3" style={{ color: "#1b4332" }}>
            Your Reports
          </h3>

          {reports.length > 0 ? (
            <ul>
              {reports.map((report) => (
                <li key={report.id || report.title} className="report-item">
                  <div>
                    <strong>{report.title}</strong>
                    <br />
                    <small className="text-muted">
                      Date: {report.date || "N/A"}
                    </small>
                  </div>

                  <button
                    className="btn btn-success"
                    onClick={() => handleDownload(report.file_url)}
                  >
                    <Download size={18} /> Download
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="no-reports">
              <Info size={18} /> No reports available.
            </div>
          )}
        </div>

        <div className="forgot-password">
          <a href="/forgot_password">
            <Lock size={18} /> Forgot / Change Password
          </a>
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
