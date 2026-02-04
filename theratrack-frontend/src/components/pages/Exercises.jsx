import React, { useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import * as poseDetection from "@tensorflow-models/pose-detection";
import { PDFDownloadLink, pdf } from "@react-pdf/renderer";
import ReactPlayer from "react-player";
import "../css/Exercises.css";
import ReportTemplate from "./ReportTemplate";

// ------------------ Backend Host ------------------
const backendHost = "http://localhost:8000";

const Exercises = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectorRef = useRef(null);
  const repStateRef = useRef("UP");
  const startTimeRef = useRef(null);
  const keypointHistoryRef = useRef([]);
  const sessionActiveRef = useRef(false);
  const currentSessionIdRef = useRef(null);
  const repsRef = useRef([]); // <-- NEW: keeps latest reps
  const [repetitionsData, setRepetitionsData] = useState([]);

  const [exercises, setExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [repCount, setRepCount] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);
  const [postureFeedback, setPostureFeedback] = useState("Stand straight and get ready! 🚀");
  const [postureAccuracy, setPostureAccuracy] = useState(0);
  const [sessionActive, setSessionActive] = useState(false);
  const [reportReady, setReportReady] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // ------------------ CSRF ------------------
  const getCSRFToken = () => {
    const name = "csrftoken";
    const cookies = document.cookie.split(";").map(c => c.trim());
    for (let cookie of cookies) {
      if (cookie.startsWith(name + "=")) return decodeURIComponent(cookie.split("=")[1]);
    }
    return null;
  };

  // ------------------ Fetch exercises ------------------
  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const res = await fetch(`${backendHost}/api/exercises/`, { credentials: "include" });
        const data = await res.json();
        setExercises(data);
        const squat = data.find(ex => ex.exercise_name.toLowerCase() === "squats");
        if (squat) setSelectedExercise(squat);

      } catch (err) {
        console.error("Error fetching exercises:", err);
      }
    };
    fetchExercises();
  }, []);

  useEffect(() => {
    console.log("Selected exercise video URL:", selectedExercise?.video_demo_url);
  }, [selectedExercise]);


  // ------------------ Init pose detector ------------------
  useEffect(() => {
    const initDetector = async () => {
      await tf.ready();
      await tf.setBackend("webgl");
      detectorRef.current = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet);
      console.log("Pose detector ready ✅");
    };
    initDetector();
  }, []);

  // ------------------ Timer ------------------
  useEffect(() => {
    let timer;
    if (sessionActive) {
      timer = setInterval(() => {
        setSessionTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [sessionActive]);

  // ------------------ Start session ------------------
  const startSession = async () => {
    if (!detectorRef.current) return alert("Pose detector not ready");
    if (!selectedExercise) return alert("Select an exercise first");

    setSessionActive(true);
    sessionActiveRef.current = true;
    setRepCount(0);
    setSessionTime(0);
    repStateRef.current = "UP";
    keypointHistoryRef.current = [];
    repsRef.current = [];
    setRepetitionsData([]);
    setPostureFeedback("📸 Initializing...");
    setReportReady(false);
    currentSessionIdRef.current = null;

    // ✅ Set start time here
    startTimeRef.current = Date.now();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      requestAnimationFrame(detectFrame);

      // Create workout session on server
      const res = await fetch(`${backendHost}/api/save_workout_session/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCSRFToken()
        },
        credentials: "include",
        body: JSON.stringify({ exercise_id: selectedExercise.exercise_id })
      });
      const data = await res.json();
      if (data.success) currentSessionIdRef.current = data.session_id;
    } catch (err) {
      alert("Could not access webcam or start session.");
      console.error(err);
    }
  };


  // ------------------ Stop session ------------------
  const stopSession = async () => {
    setSessionActive(false);
    sessionActiveRef.current = false;

    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }

    if (!currentSessionIdRef.current) return;

    try {
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

      // Update session duration
      await fetch(`${backendHost}/api/save_workout_session/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCSRFToken()
        },
        credentials: "include",
        body: JSON.stringify({
          session_id: currentSessionIdRef.current,
          duration_seconds: duration
        })
      });

      // Save repetitions
      const repsToSave = repsRef.current.map(rep => ({
        count_number: rep.count_number,
        posture_accuracy: rep.posture_accuracy,
        feedback_text: rep.feedback_text
      }));

      if (repsToSave.length > 0) {
        await fetch(`${backendHost}/api/save_repetitions/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCSRFToken()
          },
          credentials: "include",
          body: JSON.stringify({
            session_id: currentSessionIdRef.current,
            reps: repsToSave
          })
        });
      }

      // Upload PDF report
      await uploadReport(currentSessionIdRef.current, selectedExercise, repsRef.current, duration);

      setReportReady(true);
    } catch (err) {
      console.error("Error saving session/reps/feedback:", err);
    }
  };

  // ------------------ Upload PDF report ------------------
  const uploadReport = async (sessionId, exercise, repsData, duration) => {
    if (!sessionId || !exercise) return;

    try {
      const blob = await pdf(
        <ReportTemplate
          session={exercise}
          minutes={Math.floor(duration / 60)}
          seconds={duration % 60}
          totalReps={repsData.length}
          avgAccuracy={
            repsData.length > 0
              ? (repsData.reduce((sum, r) => sum + r.posture_accuracy, 0) / repsData.length).toFixed(1)
              : "0"
          }
          repetitions={repsData}
        />
      ).toBlob();

      const base64data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
      });

      await fetch(`${backendHost}/api/save_report/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCSRFToken()
        },
        credentials: "include",
        body: JSON.stringify({
          session_id: sessionId,
          pdf_base64: base64data,
          generated_by: "AI_Model"
        })
      });

      console.log("Report uploaded successfully ✅");
    } catch (err) {
      console.error("Error generating/uploading report:", err);
    }
  };

  // ------------------ Pose detection ------------------
  const detectFrame = async () => {
    if (!sessionActiveRef.current || !videoRef.current) return;

    try {
      const poses = await detectorRef.current.estimatePoses(videoRef.current);
      if (poses.length > 0) {
        drawKeypoints(poses[0]);
        handleReps(poses[0]);
      }
    } catch (err) {
      console.warn("Pose detection stopped:", err);
    }

    requestAnimationFrame(detectFrame);
  };

  const drawKeypoints = pose => {
    const ctx = canvasRef.current.getContext("2d");
    const video = videoRef.current;
    canvasRef.current.width = video.videoWidth;
    canvasRef.current.height = video.videoHeight;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    pose.keypoints.forEach(kp => {
      if (kp.score > 0.5) {
        ctx.beginPath();
        ctx.arc(kp.x, kp.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = "red";
        ctx.fill();
      }
    });
  };
  const getReactPlayerUrl = (url) => {
    if (!url) return "";
    // Shorts URL → watch URL
    if (url.includes("/shorts/")) {
      return "https://www.youtube.com/watch?v=" + url.split("/shorts/")[1].split("?")[0];
    }
    // Embed URL → watch URL
    if (url.includes("/embed/")) {
      return "https://www.youtube.com/watch?v=" + url.split("/embed/")[1].split("?")[0];
    }
    // Already a watch URL
    if (url.includes("watch?v=")) {
      return url.split("&")[0]; // remove extra params
    }
    // fallback
    return url;
  };
  const smoothKeypoints = keypoints => {
    keypointHistoryRef.current.push(keypoints);
    if (keypointHistoryRef.current.length > 5) keypointHistoryRef.current.shift();

    return keypoints.map((kp, idx) => {
      let avgX = 0, avgY = 0, avgScore = 0;
      keypointHistoryRef.current.forEach(frame => {
        avgX += frame[idx].x;
        avgY += frame[idx].y;
        avgScore += frame[idx].score;
      });
      const n = keypointHistoryRef.current.length;
      return { ...kp, x: avgX / n, y: avgY / n, score: avgScore / n };
    });
  };

  const handleReps = (pose) => {
    const keypoints = smoothKeypoints(pose.keypoints);

    const leftHip = keypoints.find(k => k.name === "left_hip");
    const leftKnee = keypoints.find(k => k.name === "left_knee");
    const leftAnkle = keypoints.find(k => k.name === "left_ankle");
    if (!leftHip || !leftKnee || !leftAnkle) return;

    const kneeAngle = getAngle(leftHip, leftKnee, leftAnkle);

    let postureScore = 60 + Math.max(0, Math.min(1, (180 - kneeAngle) / 120)) * 40;
    postureScore = Math.round(postureScore);
    setPostureAccuracy(postureScore);

    let liveFeedback;
    if (postureScore > 85) liveFeedback = "Excellent form! Keep it up 💪";
    else if (postureScore > 70) liveFeedback = "Good form! Almost perfect 👍";
    else liveFeedback = "Adjust your posture ⚠️";
    setPostureFeedback(liveFeedback);

    if (kneeAngle < 100 && repStateRef.current === "UP") repStateRef.current = "DOWN";

    if (kneeAngle > 160 && repStateRef.current === "DOWN") {
      repStateRef.current = "UP";

      // ✅ Add rep to state AND ref
      setRepetitionsData(prev => {
        const newRepNumber = prev.length + 1;
        const newRep = {
          count_number: newRepNumber,
          posture_accuracy: postureScore,
          feedback_text:
            postureScore > 85
              ? `Excellent! Rep #${newRepNumber} perfect ✅`
              : postureScore > 70
                ? `Good! Rep #${newRepNumber} almost there 👍`
                : `Needs improvement! Rep #${newRepNumber} keep trying ⚠️`
        };

        const newArray = [...prev, newRep];
        repsRef.current = newArray; // update ref immediately

        setRepCount(newRepNumber);
        setPostureFeedback(newRep.feedback_text);

        return newArray;
      });
    }
  };

  const getAngle = (a, b, c) => {
    const ab = { x: a.x - b.x, y: a.y - b.y };
    const cb = { x: c.x - b.x, y: c.y - b.y };
    const dot = ab.x * cb.x + ab.y * cb.y;
    return (Math.acos(dot / (Math.sqrt(ab.x ** 2 + ab.y ** 2) * Math.sqrt(cb.x ** 2 + cb.y ** 2))) * 180) / Math.PI;
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ------------------ JSX ------------------
  return (
    <div className="exercise-page container py-5">
      <div className="row g-4">
        <div className="col-lg-7">
          <div className="video-container">
            <video ref={videoRef} autoPlay muted playsInline />
            <canvas ref={canvasRef} />
          </div>
        </div>

        <div className="col-lg-5">
          <div className="glass-card p-4">
            <h3>Select Exercise</h3>
            <div className="exercise-select-wrapper d-flex justify-content-between">
              <div className="exercise-dropdown mb-3" ref={dropdownRef} style={{ width: "43%" }}>
                <div
                  className={`dropdown-header ${dropdownOpen ? "open" : ""}`}
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <span>{selectedExercise ? selectedExercise.exercise_name : "Select Exercise"}</span>
                  <i className={`fa-solid fa-angle-up arrow ${dropdownOpen ? "rotated" : ""}`}></i>
                </div>
                {dropdownOpen && (
                  <ul className="dropdown-list">
                    {exercises
                      .filter(ex =>
                        ["squats", "bicep curls", "side leg raises"].includes(
                          ex.exercise_name.toLowerCase()
                        )
                      )
                      .map((ex) => (
                        <li
                          key={ex.exercise_id}
                          onClick={() => {
                            setSelectedExercise(ex);
                            setDropdownOpen(false);
                          }}
                        >
                          {ex.exercise_name}
                        </li>
                      ))}
                  </ul>
                )}
              </div>

              <button
                className="btn btn-info open-info-modal-btn"
                onClick={() => setModalOpen(true)}
              >
                Info
              </button>
            </div>

            {selectedExercise && (
              <div className="mb-3 exercise-info-large">
                <p>Description:</p><span>{selectedExercise.description}</span>
                <p className="mt-3">Target Muscle:</p><span>{selectedExercise.target_muscle}</span>
                <p className="mt-3">Difficulty Level:</p><span>{selectedExercise.difficulty_level}</span>
              </div>
            )}

            <h2>{postureFeedback}</h2>

            <div className="d-flex justify-content-between">
              <div className="d-flex gap-1"><p>Reps: </p><span>{repCount}</span></div>
              <div className="d-flex gap-1"><p>Duration: </p><span>{sessionTime}s</span></div>
            </div>

            <div className="d-flex gap-1"><p>Accuracy: </p><span>{postureAccuracy}%</span></div>

            <div className="d-flex gap-2 mt-3">
              <button className="btn btn-custom-start customBtn" onClick={startSession} disabled={sessionActive}>Start</button>
              <button className="btn btn-danger customBtn" onClick={stopSession} disabled={!sessionActive}>Stop</button>
            </div>

            {reportReady && (
              <PDFDownloadLink
                document={
                  <ReportTemplate
                    session={selectedExercise}
                    minutes={Math.floor(sessionTime / 60)}
                    seconds={sessionTime % 60}
                    totalReps={repCount}
                    avgAccuracy={
                      repetitionsData.length > 0
                        ? (repetitionsData.reduce((sum, r) => sum + r.posture_accuracy, 0) / repetitionsData.length).toFixed(1)
                        : "0"
                    }
                    repetitions={repetitionsData}
                  />
                }
                fileName="Workout_Report.pdf"
                className="btn btn-primary mb-3 customBtn"
                style={{ width: "177px", lineHeight: "1.8" }}
              >
                {({ loading }) => (loading ? "Generating PDF..." : "Download Report")}
              </PDFDownloadLink>
            )}

            {selectedExercise?.video_demo_url && (
              <div className="mt-4">
                <h4>Exercise Demo Video</h4>
                <div style={{ position: "relative", paddingTop: "56.25%" }}>
                  <iframe
                    src={selectedExercise.video_demo_url} // must be a watch URL like https://www.youtube.com/watch?v=...
                    title="Exercise Video"
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      border: "0"
                    }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`exercise-info-modal ${modalOpen ? "show" : ""}`}>
        <div className="modal-content">
          <span className="close" onClick={() => setModalOpen(false)}>&times;</span>
          {selectedExercise && (
            <>
              <h3 className="mb-3">{selectedExercise.exercise_name}</h3>
              <div className="modal-section"><p>Description:</p><span>{selectedExercise.description}</span></div>
              <div className="modal-section"><p>Target Muscle:</p><span>{selectedExercise.target_muscle}</span></div>
              <div className="modal-section"><p>Difficulty Level:</p><span>{selectedExercise.difficulty_level}</span></div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Exercises;
