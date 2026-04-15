import React, { useEffect, useRef, useState, useCallback } from "react";
import * as tf from "@tensorflow/tfjs";
import * as poseDetection from "@tensorflow-models/pose-detection";
import { PDFDownloadLink, pdf } from "@react-pdf/renderer";
import "../css/Exercises.css";
import ReportTemplate from "./ReportTemplate";
import { extractFeatures } from "../../ai/featureExtractor";

const backendHost = "http://localhost:8000";

const Exercises = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectorRef = useRef(null);
  const modelRef = useRef(null);

  const startTimeRef = useRef(null);
  const sessionActiveRef = useRef(false);
  const currentSessionIdRef = useRef(null);

  const repsRef = useRef([]);
  const repStateRef = useRef({
    squats: "UP",
    "bicep curls": "DOWN",
    "side leg raises": "DOWN",
  });

  const lastRepTimeRef = useRef({
    squats: 0,
    "bicep curls": 0,
    "side leg raises": 0,
  });
  const lastKneeAngleRef = useRef(null);

  const [exercises, setExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);

  const [repCount, setRepCount] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);

  const [postureFeedback, setPostureFeedback] = useState("Stand straight and get ready! 🚀");
  const [postureAccuracy, setPostureAccuracy] = useState(0);

  const previousKeypointsRef = useRef([]);
  const squatStableFrames = useRef(0);
  const lastFrameTime = useRef(0);

  const [sessionActive, setSessionActive] = useState(false);
  const [reportReady, setReportReady] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const sequenceRef = useRef([]);
  const ctxRef = useRef(null);

  // ------------------ Auth token ------------------
  const getAccessToken = () => localStorage.getItem("access_token");

  // ------------------ Fetch exercises ------------------
  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const accessToken = getAccessToken();
        const res = await fetch(`${backendHost}/api/exercises/`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          }
        });

        if (!res.ok) throw new Error("Unauthorized or failed to fetch exercises");

        const data = await res.json();
        setExercises(data);
        const squat = data.find(ex => ex.exercise_name.toLowerCase() === "squats");
        if (data.length) setSelectedExercise(squat);
      } catch (err) {
        console.error("Error fetching exercises:", err);
      }
    };
    fetchExercises();
  }, []);

  // ------------------ Init pose detector ------------------
  useEffect(() => {
    const initDetector = async () => {
      await tf.ready();
      await tf.setBackend("webgl");

      detectorRef.current = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING
        }
      );

      console.log("Pose detector ready");
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

  // ------------------ Handle click outside dropdown ------------------
  // ------------------ Handle dropdown click outside ------------------
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const collectTrainingData = useCallback(async (features, label) => {
    if (!features || !selectedExercise) return;

    try {
      const accessToken = getAccessToken();

      await fetch(`${backendHost}/api/collect_training_data/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          exercise: selectedExercise.exercise_name,
          features,
          label
        })
      });

      console.log("Training data saved:", label);
    } catch (err) {
      console.error("Data collection error:", err);
    }
  }, [selectedExercise]);

  // ------------------ Keyboard controls (C / I for dataset) ------------------
  useEffect(() => {
    const handleKey = (e) => {
      const key = e.key.toLowerCase();

      console.log("KEY PRESSED:", key); // 👈 DEBUG

      if (!lastFeaturesRef.current) {
        console.log("No features yet");
        return;
      }

      if (key === "c") {
        console.log("C pressed → sending correct");
        collectTrainingData(lastFeaturesRef.current, "correct");
      }

      if (key === "i") {
        console.log("I pressed → sending incorrect");
        collectTrainingData(lastFeaturesRef.current, "incorrect");
      }
    };

    window.addEventListener("keydown", handleKey);

    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // ------------------ Start session ------------------
  const startSession = async () => {
    setSessionActive(true);
    sessionActiveRef.current = true;
    setRepCount(0);
    repsRef.current = [];
    repStateRef.current = {
      squats: "UP",
      "bicep curls": "DOWN",
      "side leg raises": "DOWN",
    };

    setPostureFeedback("📸 Initializing...");
    setReportReady(false);
    currentSessionIdRef.current = null;
    startTimeRef.current = Date.now();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 360 },
          facingMode: "user"
        }
      });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      requestAnimationFrame(detectFrame);

      const accessToken = getAccessToken();
      const res = await fetch(`${backendHost}/api/save_workout_session/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
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
      const accessToken = getAccessToken();

      await fetch(`${backendHost}/api/save_workout_session/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ session_id: currentSessionIdRef.current, duration_seconds: duration })
      });

      if (repsRef.current.length > 0) {
        await fetch(`${backendHost}/api/save_repetitions/`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ session_id: currentSessionIdRef.current, reps: repsRef.current })
        });
      }

      await uploadReport(currentSessionIdRef.current, selectedExercise, repsRef.current, duration);
      setReportReady(true);
    } catch (err) {
      console.error("Error saving session/reps/report:", err);
    }
  };

  const updateSequence = (features) => {
    sequenceRef.current.push(features);

    if (sequenceRef.current.length > 10) {
      sequenceRef.current.shift();
    }

    return sequenceRef.current;
  };
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      ctxRef.current = canvas.getContext("2d");
    }
  }, []);
  const autoZoomAndDraw = (pose) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !video || video.videoWidth === 0) return;


    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    // match canvas exactly to video
    canvas.width = videoWidth;
    canvas.height = videoHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // draw video first
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const scaleX = canvas.width / videoWidth;
    const scaleY = canvas.height / videoHeight;

    const keypoints = pose.keypoints;

    // helper: scaled coordinates
    const getX = (x) => x * scaleX;
    const getY = (y) => y * scaleY;

    // Draw joints
    keypoints.forEach((kp) => {
      if (kp.score > 0.4) {
        ctx.beginPath();
        ctx.arc(getX(kp.x), getY(kp.y), 6, 0, 2 * Math.PI);
        ctx.fillStyle = "#FF3B3B";
        ctx.fill();
      }
    });

    // Skeleton connections
    const connections = [
      ["left_shoulder", "right_shoulder"],
      ["left_shoulder", "left_elbow"],
      ["left_elbow", "left_wrist"],
      ["right_shoulder", "right_elbow"],
      ["right_elbow", "right_wrist"],
      ["left_shoulder", "left_hip"],
      ["right_shoulder", "right_hip"],
      ["left_hip", "right_hip"],
      ["left_hip", "left_knee"],
      ["left_knee", "left_ankle"],
      ["right_hip", "right_knee"],
      ["right_knee", "right_ankle"],
    ];

    const getPoint = (name) =>
      keypoints.find((k) => k.name === name);

    ctx.strokeStyle = "#00FFAA";
    ctx.lineWidth = 4;

    connections.forEach(([p1, p2]) => {
      const kp1 = getPoint(p1);
      const kp2 = getPoint(p2);

      if (kp1 && kp2 && kp1.score > 0.4 && kp2.score > 0.4) {
        ctx.beginPath();
        ctx.moveTo(getX(kp1.x), getY(kp1.y));
        ctx.lineTo(getX(kp2.x), getY(kp2.y));
        ctx.stroke();
      }
    });
  };

  // Utility function to convert watch URL to embed URL
  const getEmbedUrl = (url) => {
    if (!url) return null;

    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes("youtube.com") && urlObj.searchParams.has("v")) {
        return `https://www.youtube.com/embed/${urlObj.searchParams.get("v")}`;
      }
      // if already embed URL, return as is
      if (urlObj.hostname.includes("youtube.com") && urlObj.pathname.startsWith("/embed/")) {
        return url;
      }
      return url; // for other video platforms, just return
    } catch (err) {
      return url; // fallback
    }
  };

  const calculateAvgAccuracy = (repsData) => {
    if (!repsData || repsData.length === 0) return 0;

    const total = repsData.reduce(
      (sum, rep) => sum + (rep.posture_accuracy || 0),
      0
    );
    return total / repsData.length;
  };

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // ------------------ Upload PDF report ------------------
  const uploadReport = async (sessionId, exercise, repsData, duration) => {
    if (!sessionId || !exercise) return;

    try {
      const avgAccuracy = calculateAvgAccuracy(repsData);

      const blob = await pdf(
        <ReportTemplate
          session={exercise}
          minutes={Math.floor(duration / 60)}
          seconds={duration % 60}
          totalReps={repsData.length}
          avgAccuracy={avgAccuracy}
          repetitions={repsData}
        />
      ).toBlob();

      const base64data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
      });

      const accessToken = getAccessToken();

      await fetch(`${backendHost}/api/save_report/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
          pdf_base64: base64data,
          generated_by: "AI_Model",
        }),
      });
    } catch (err) {
      console.error("Error generating/uploading report:", err);
    }
  };

  const smoothKeypoints = (newKps) => {
    const prev = previousKeypointsRef.current;

    if (!prev || prev.length === 0) {
      previousKeypointsRef.current = newKps;
      return newKps;
    }

    const smoothed = newKps.map((kp, i) => {
      const prevKp = prev[i];

      if (!prevKp) return kp;

      return {
        ...kp,
        x: kp.x * 0.6 + prevKp.x * 0.4,
        y: kp.y * 0.6 + prevKp.y * 0.4,
        score: kp.score
      };
    });

    previousKeypointsRef.current = smoothed;
    return smoothed;
  };

  const lastFeaturesRef = useRef(null);
  const getActiveSide = (kps) => {
    const leftHip = kps.find(k => k.name === "left_hip");
    const rightHip = kps.find(k => k.name === "right_hip");

    if (!leftHip || !rightHip) return "unknown";

    // lower score = not visible side
    return leftHip.score > rightHip.score ? "left" : "right";
  };

  // ---------- SQUATS ----------
  const detectSquatRep = (f) => {
    const angle = f.kneeAngle;
    if (!angle) return false;

    const state = repStateRef.current.squats;
    const now = Date.now();

    const lastAngle = lastKneeAngleRef.current;
    lastKneeAngleRef.current = angle;

    const isGoingDown = lastAngle != null && angle < lastAngle - 2;
    const isGoingUp = lastAngle != null && angle > lastAngle + 2;

    // ---------------- IDLE FILTER ----------------
    // If user is standing still, ignore everything
    if (!isGoingDown && !isGoingUp && state === "UP") {
      return false;
    }

    // ---------------- START DOWN MOVEMENT ----------------
    if (state === "UP") {
      if (angle < 150 && isGoingDown) {
        squatStableFrames.current++;
      } else {
        squatStableFrames.current = 0;
      }

      if (squatStableFrames.current >= 5) {
        repStateRef.current.squats = "DOWN";
        squatStableFrames.current = 0;
      }
    }

    // ---------------- START UP MOVEMENT ----------------
    if (state === "DOWN") {
      if (isGoingUp) {
        squatStableFrames.current++;
      } else {
        squatStableFrames.current = 0;
      }

      if (angle > 150 && squatStableFrames.current >= 5) {
        repStateRef.current.squats = "UP";

        // debounce (prevents double counting)
        if (now - lastRepTimeRef.current.squats < 1200) return false;

        lastRepTimeRef.current.squats = now;
        squatStableFrames.current = 0;

        return true;
      }
    }

    return false;
  };

  // ---------- BICEP CURL ----------
  const detectBicepRep = (features) => {
    const angle = features.elbowAngle;
    if (angle == null || isNaN(angle)) return false;

    const ex = "bicep curls";
    const state = repStateRef.current[ex];

    if (state === "DOWN" && angle > 150) {
      repStateRef.current[ex] = "UP";
    }

    if (state === "UP" && angle < 60) {
      repStateRef.current[ex] = "DOWN";

      const now = Date.now();
      if (now - lastRepTimeRef.current[ex] < 1200) return false;

      lastRepTimeRef.current[ex] = now;
      return true;
    }
    return false;
  };

  // ---------- SIDE LEG RAISE ----------
  const detectLegRaiseRep = (features) => {
    const angle = features.legRaiseAngle;
    if (angle == null || isNaN(angle)) return false;

    const ex = "side leg raises";
    const state = repStateRef.current[ex];
    const now = Date.now();

    // standing → leg down
    if (state === "DOWN" && angle < 140) {
      repStateRef.current[ex] = "UP";
    }

    // leg raised → coming back down
    if (state === "UP" && angle > 160) {
      repStateRef.current[ex] = "DOWN";

      if (now - lastRepTimeRef.current[ex] < 1200) return false;

      lastRepTimeRef.current[ex] = now;
      return true;
    }

    return false;
  };

  const detectRep = (features) => {
    const name = selectedExercise?.exercise_name?.toLowerCase();

    switch (name) {
      case "squats":
        return detectSquatRep(features);

      case "bicep curls":
        return detectBicepRep(features);

      case "side leg raises":
        return detectLegRaiseRep(features);

      default:
        return false;
    }
  };

  const predictPosture = async (features) => {
    try {
      const res = await fetch(`${backendHost}/api/predict_posture/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`
        },
        body: JSON.stringify({
          features,
          exercise: selectedExercise?.exercise_name?.toLowerCase()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Backend Error:", data);
        return { label: "unknown", prob: 0 };
      }

      return data;

    } catch (err) {
      console.error("Request failed:", err);
      return { label: "unknown", prob: 0 };
    }
  };

  // ---------------- DETECTION LOOP ----------------
  const detectFrame = async () => {
    if (!sessionActiveRef.current) return;

    try {
      const poses = await detectorRef.current.estimatePoses(videoRef.current);

      if (!poses || poses.length === 0) {
        requestAnimationFrame(detectFrame);
        return;
      }

      // ---------------- KEYPOINTS ----------------
      const rawKeypoints = poses[0].keypoints.map((kp) => ({
        x: kp.x,
        y: kp.y,
        score: kp.score,
        name: kp.name
      }));

      const smoothedKeypoints = smoothKeypoints(rawKeypoints);

      // DRAW
      autoZoomAndDraw({ keypoints: smoothedKeypoints });

      // ---------------- FEATURES ----------------
      const activeSide = getActiveSide(smoothedKeypoints);

      const features = extractFeatures(smoothedKeypoints, activeSide);
      lastFeaturesRef.current = features;

      // ---------------- SEQUENCE BUFFER ----------------
      const sequence = updateSequence(features);

      // ---------------- PREDICTION ----------------
      let prediction = {
        label: "unknown",
        prob: 0,
        feedback: ""
      };

      const payload = features;
      prediction = await predictPosture(payload);

      // ---------------- UI UPDATE ----------------
      const accuracy = prediction?.prob
        ? Math.min(100, Math.round(prediction.prob * 100))
        : 0;

      setPostureAccuracy(accuracy);
      const validateSquatForm = (features) => {
        const knee = features.kneeAngle;

        if (!knee || isNaN(knee)) return { valid: false, msg: "No pose detected properly" };

        // TOO STRAIGHT (not a squat)
        if (knee > 160) {
          return { valid: false, msg: "⚠️ You are not squatting enough" };
        }

        // TOO DEEP / unstable
        if (knee < 70) {
          return { valid: false, msg: "⚠️ Too deep - risk of injury" };
        }

        return { valid: true, msg: "" };
      };

      const getExerciseFeedback = (label, prob, exercise, features) => {
        const name = exercise?.toLowerCase();

        // ---------------- SQUATS ----------------
        if (name === "squats") {
          const knee = features.kneeAngle;

          if (!knee || isNaN(knee)) return "⚠️ Stand in camera view properly";

          // posture guidance
          if (knee > 165) return "⬇️ Go lower into your squat";
          if (knee < 70) return "⚠️ Too deep — reduce depth for safety";

          if (knee > 140 && knee < 165) {
            return label === "correct"
              ? "👍 Good depth — now go a bit lower"
              : "⬇️ Slightly lower your squat";
          }

          if (label === "correct" && prob > 0.85) return "🔥 Perfect squat form!";
          if (label === "correct") return "👍 Solid squat — keep it steady";

          return "🧍 Keep chest up and control your descent";
        }

        // ---------------- BICEP CURLS ----------------
        if (name === "bicep curls") {
          const angle = features.elbowAngle;

          if (!angle || isNaN(angle)) return "💪 Position your arm in frame";

          // too extended
          if (angle > 160) return "⬇️ Start curl — bend your elbow";

          // too curled
          if (angle < 40) return "⬆️ Slowly extend your arm fully";

          // mid range guidance
          if (angle >= 90 && angle <= 140) {
            return "💪 Nice control — keep elbow stable";
          }

          if (label === "correct") return "🔥 Clean curl — strong movement!";
          return "⚠️ Avoid swinging your body";
        }

        // ---------------- SIDE LEG RAISES ----------------
        if (name === "side leg raises") {
          const angle = features.legRaiseAngle;

          if (!angle || isNaN(angle)) return "🦵 Stand sideways to camera";

          // not lifting enough
          if (angle > 165) return "⬆️ Lift your leg higher";

          // too high / unstable
          if (angle < 120) return "⚠️ Too high — control your movement";

          // mid control zone
          if (angle >= 120 && angle <= 150) {
            return "🚀 Great control — hold and lower slowly";
          }

          if (label === "correct") return "🔥 Perfect leg raise!";
          return "🦵 Keep hips steady — don’t swing";
        }

        return "Keep going! 💪";
      };

      setPostureFeedback(
        getExerciseFeedback(
          prediction?.label,
          prediction?.prob,
          selectedExercise?.exercise_name,
          features
        )
      );

      const validPose =
        smoothedKeypoints.filter(kp => kp.score > 0.4).length > 10;

      if (!validPose) {
        requestAnimationFrame(detectFrame);
        return;
      }

      const now = performance.now();
      if (now - lastFrameTime.current < 100) {
        requestAnimationFrame(detectFrame);
        return;
      }
      lastFrameTime.current = now;

      // ---------------- REP DETECTION ----------------
      const repCompleted = detectRep(features);

      if (repCompleted) {
        const newRep = {
          count_number: repCount + 1,
          posture_accuracy: accuracy,
          feedback_text: prediction?.feedback || ""
        };

        repsRef.current = [...repsRef.current, newRep];
        setRepCount(prev => prev + 1);
      }

    } catch (err) {
      console.error("Detection error:", err);
    }

    requestAnimationFrame(detectFrame);
  };

  // ------------------ JSX ------------------
  return (
    <div className="exercise-page container py-5">
      <div className="row g-4">
        <div className="col-lg-7">
          <div className="video-container">
            <video ref={videoRef} autoPlay muted playsInline />
            <canvas ref={canvasRef} id="overlay" />
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
              <div className="d-flex gap-1"><p>Duration: </p><span>{formatTime(sessionTime)}</span></div>
            </div>

            <div className="d-flex gap-1"><p>Accuracy: </p><span>{postureAccuracy}%</span></div>

            <div className="d-flex gap-2 mt-3">
              <button className="btn btn-custom-start customBtn" onClick={startSession} disabled={sessionActive}>Start</button>
              <button className="btn btn-danger customBtn" onClick={stopSession} disabled={!sessionActive}>Stop</button>
            </div>

            <div className="d-flex gap-2 mt-3">
              <button
                className="btn btn-success"
                onClick={() => {
                  if (!lastFeaturesRef.current) {
                    console.log("No features yet");
                    return;
                  }
                  console.log("Manual CORRECT");
                  collectTrainingData(lastFeaturesRef.current, "correct");
                }}
              >
                ✅ Correct
              </button>

              <button
                className="btn btn-warning"
                onClick={() => {
                  if (!lastFeaturesRef.current) {
                    console.log("No features yet");
                    return;
                  }
                  console.log("Manual INCORRECT");
                  collectTrainingData(lastFeaturesRef.current, "incorrect");
                }}
              >
                ❌ Incorrect
              </button>
            </div>

            {reportReady && (
              <PDFDownloadLink
                document={
                  <ReportTemplate
                    session={selectedExercise}
                    minutes={Math.floor(sessionTime / 60)}
                    seconds={sessionTime % 60}
                    totalReps={repCount}
                    avgAccuracy={calculateAvgAccuracy(repsRef.current)}
                    repetitions={repsRef.current}
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
                    src={getEmbedUrl(selectedExercise.video_demo_url)}
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
