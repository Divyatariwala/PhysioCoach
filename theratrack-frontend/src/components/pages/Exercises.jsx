// Exercises.jsx
import React, { useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import * as posedetection from "@tensorflow-models/pose-detection";
import "@tensorflow/tfjs-backend-webgl"; // Ensure WebGL backend
import "../css/Exercises.css";
import ReportTemplate from "./ReportTemplate";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function Exercises() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const reportRef = useRef(null);

  const detectorRef = useRef(null);
  const repetitionsRef = useRef([]);
  const repStateRef = useRef("UP");
  const sessionActiveRef = useRef(false);
  const sessionIdRef = useRef(null);

  const [exerciseData, setExerciseData] = useState([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState("");
  const [exerciseInfo, setExerciseInfo] = useState({});
  const [repCount, setRepCount] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);
  const [feedback, setFeedback] = useState("Stand straight and get ready 🚀");
  const [showReportBtn, setShowReportBtn] = useState(false);
  const [reportUrl, setReportUrl] = useState(null);

  const backendHost = "http://localhost:8000";

  // ------------------- CSRF Token -------------------
  const getCookie = (name) => {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
      const cookies = document.cookie.split(";");
      for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.startsWith(name + "=")) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  };
  const csrftoken = getCookie("csrftoken");

  // ------------------- Load Exercises -------------------
  useEffect(() => {
    fetch(`${backendHost}/api/exercises/`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setExerciseData(data);
        if (data.length > 0) setSelectedExerciseId(data[0].id);
      })
      .catch((err) => console.error("Error fetching exercises:", err));
  }, []);

  useEffect(() => {
    const ex = exerciseData.find((e) => e.id === Number(selectedExerciseId));
    setExerciseInfo(ex || {});
  }, [selectedExerciseId, exerciseData]);

  // ------------------- Initialize TensorFlow Detector -------------------
  useEffect(() => {
    async function initDetector() {
      try {
        // 1️⃣ Ensure TF is ready
        await tf.ready();
        // 2️⃣ Set backend
        await tf.setBackend("webgl");
        await tf.ready();

        // 3️⃣ Create MoveNet detector
        const detector = await posedetection.createDetector(
          posedetection.SupportedModels.MoveNet,
          { modelType: posedetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
        );

        detectorRef.current = detector;
        console.log("Pose detector ready");
      } catch (err) {
        console.error("TensorFlow detector initialization failed:", err);
      }
    }
    initDetector();
  }, []);

  // ------------------- Draw Keypoints -------------------
  const drawKeypoints = (pose) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    pose.keypoints.forEach((kp) => {
      if (kp.score > 0.5) {
        ctx.beginPath();
        ctx.arc(kp.x, kp.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#ff1744";
        ctx.fill();
      }
    });
  };

  // ------------------- Handle Reps -------------------
  const handleReps = (pose) => {
    const hip = pose.keypoints[11];
    const knee = pose.keypoints[13];
    const ankle = pose.keypoints[15];
    if (!hip || !knee || !ankle) return;

    // Calculate knee angle
    const angle =
      Math.abs(
        Math.atan2(ankle.y - knee.y, ankle.x - knee.x) -
        Math.atan2(hip.y - knee.y, hip.x - knee.x)
      ) *
      (180 / Math.PI);

    if (angle < 90 && repStateRef.current === "UP") repStateRef.current = "DOWN";

    if (angle > 160 && repStateRef.current === "DOWN") {
      repStateRef.current = "UP";
      setRepCount((prev) => prev + 1);
      repetitionsRef.current.push({
        posture_accuracy: Math.min(100, Math.max(60, angle)),
      });
      setFeedback("Good rep! 💪");
    }
  };

  // ------------------- Pose Loop -------------------
  const detectPose = async () => {
    if (!sessionActiveRef.current) return;
    const detector = detectorRef.current;
    const video = videoRef.current;
    if (!detector || !video.videoWidth) {
      requestAnimationFrame(detectPose);
      return;
    }

    const poses = await detector.estimatePoses(video);
    if (poses.length > 0) {
      drawKeypoints(poses[0]);
      handleReps(poses[0]);
    }

    setSessionTime((prev) => prev + 1);
    requestAnimationFrame(detectPose);
  };

  // ------------------- Start Session -------------------
  const startSession = async () => {
    setRepCount(0);
    setSessionTime(0);
    setFeedback("Workout started 🔥");
    setShowReportBtn(false);
    setReportUrl(null);
    repetitionsRef.current = [];
    repStateRef.current = "UP";
    sessionActiveRef.current = true;

    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.current.srcObject = stream;
    videoRef.current.play();

    detectPose();
  };

  // ------------------- Stop Session & Save -------------------
  // ------------------- Stop Session & Save -------------------
  const stopSession = async () => {
    sessionActiveRef.current = false;

    // Stop webcam
    const video = videoRef.current;
    if (video.srcObject) {
      video.srcObject.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
    }

    setFeedback("Session completed ✅");
    setShowReportBtn(true);

    try {
      // ------------------- 1️⃣ SAVE WORKOUT SESSION -------------------
      const sessionRes = await fetch(`${backendHost}/api/save_workout_session/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrftoken,
        },
        body: JSON.stringify({
          exercise_id: Number(selectedExerciseId),
          duration_seconds: sessionTime,
        }),
      });

      const sessionData = await sessionRes.json();
      if (!sessionData.success) throw new Error(sessionData.error || "Failed to save session");
      sessionIdRef.current = sessionData.session_id;

      // ------------------- 2️⃣ SAVE REPETITIONS -------------------
      const repsToSend = repetitionsRef.current.map((r, idx) => ({
        count_number: idx + 1,
        posture_accuracy: r.posture_accuracy,
      }));

      const repsRes = await fetch(`${backendHost}/api/save_repetitions/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrftoken,
        },
        body: JSON.stringify({
          session_id: sessionIdRef.current,
          reps: repsToSend,
        }),
      });

      const repsData = await repsRes.json();
      if (!repsData.success) throw new Error(repsData.error || "Failed to save repetitions");

      // ------------------- 3️⃣ SAVE FEEDBACK ONLY (No PDF) -------------------
      const avgAccuracy =
        repsToSend.length > 0
          ? repsToSend.reduce((acc, r) => acc + r.posture_accuracy, 0) / repsToSend.length
          : 0;

      const feedbackRes = await fetch(`${backendHost}/api/save_feedback/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrftoken,
        },
        body: JSON.stringify({
          session_id: sessionIdRef.current,
          feedback_text: feedback,
          accuracy_score: avgAccuracy,
        }),
      });

      const feedbackData = await feedbackRes.json();
      if (feedbackData.success) {
        setFeedback("Session saved! You can generate your report ✅");
      } else {
        setFeedback("Feedback save failed ❌");
        console.error("Feedback API error:", feedbackData.error);
      }
    } catch (err) {
      console.error("Error saving session:", err);
      setFeedback("Error saving session ❌");
    }
  };


  // ------------------- Generate PDF & Upload -------------------
  const generateReport = async () => {
    const canvas = await html2canvas(reportRef.current);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, width, height);

    const blob = pdf.output("blob");
    const url = URL.createObjectURL(blob);
    setReportUrl(url);

    // Upload to backend
    const formData = new FormData();
    formData.append("pdf_file", blob, `Workout_Report_${sessionIdRef.current}.pdf`);
    formData.append("session_id", sessionIdRef.current);
    formData.append("exercise_id", selectedExerciseId);

    await fetch(`${backendHost}/api/save_report_file/`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
  };

  return (
    <div className="exercise-page container">
      <div className="video-container">
        <video ref={videoRef} muted playsInline />
        <canvas ref={canvasRef} />
      </div>

      <div className="glass-card">
        <select
          value={selectedExerciseId}
          onChange={(e) => setSelectedExerciseId(e.target.value)}
        >
          {exerciseData.map((ex) => (
            <option key={ex.id} value={ex.id}>{ex.exercise_name}</option>
          ))}
        </select>

        <p>Reps: {repCount}</p>
        <p>Time: {sessionTime}s</p>
        <p>{feedback}</p>

        <button onClick={startSession}>Start</button>
        <button onClick={stopSession}>Stop</button>

        {showReportBtn && <button onClick={generateReport}>Generate Report</button>}
        {reportUrl && <a href={reportUrl} download="Workout_Report.pdf">Download Report</a>}
      </div>

      <div style={{ position: "absolute", left: "-9999px" }}>
        <div ref={reportRef}>
          <ReportTemplate
            session={{ exercise: exerciseInfo }}
            totalReps={repCount}
            avgAccuracy={
              repetitionsRef.current.length
                ? repetitionsRef.current.reduce((a, r) => a + r.posture_accuracy, 0) /
                repetitionsRef.current.length
                : 0
            }
            repetitions={repetitionsRef.current.map((r, i) => ({
              count_number: i + 1,
              posture_accuracy: r.posture_accuracy,
            }))}
          />
        </div>
      </div>
    </div>
  );
}

export default Exercises;
// Exercises.js