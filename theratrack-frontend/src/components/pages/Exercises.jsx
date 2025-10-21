import React, { useEffect, useRef, useState } from "react";
import { initDetector, getAngle, smoothKeypoints } from "../js/Exercises";
import "../css/Exercises.css";

function Exercises({ exercises, exerciseDataJson }) {
  const videoRef = useRef(null);
  const overlayRef = useRef(null);

  const [selectedExerciseId, setSelectedExerciseId] = useState(null);
  const [exerciseInfo, setExerciseInfo] = useState({});
  const [repCount, setRepCount] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);
  const [postureFeedback, setPostureFeedback] = useState("Stand straight and get ready! 🚀");
  const [postureAccuracy, setPostureAccuracy] = useState(0);

  const detectorRef = useRef(null);
  const sessionActiveRef = useRef(false);
  const startTimeRef = useRef(0);
  const repStateRef = useRef("UP");
  const keypointHistoryRef = useRef([]);
  const repetitionsDataRef = useRef([]);

  const exerciseData = JSON.parse(exerciseDataJson || "[]");

  useEffect(() => {
    const loadDetector = async () => {
      detectorRef.current = await initDetector();
      console.log("Detector ready");
    };
    loadDetector();
  }, []);

  useEffect(() => {
    const exercise = exerciseData.find(e => e.id === parseInt(selectedExerciseId));
    if (exercise) setExerciseInfo(exercise);
    else setExerciseInfo({});
  }, [selectedExerciseId]);

  const drawKeypoints = (pose) => {
    const canvas = overlayRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const points = pose.keypoints.filter(k => k.score > 0.5);
    points.forEach(k => {
      ctx.beginPath();
      ctx.arc(k.x, k.y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = "#ff1744";
      ctx.fill();
    });
  };

  const detectFrame = async () => {
    if (!sessionActiveRef.current) return;
    const detector = detectorRef.current;
    const video = videoRef.current;
    if (!detector || !video) return;

    const poses = await detector.estimatePoses(video);
    if (poses.length > 0) drawKeypoints(poses[0]);
    setSessionTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    requestAnimationFrame(detectFrame);
  };

  const handleStart = async () => {
    if (!detectorRef.current) return alert("Pose detector not ready!");
    if (!selectedExerciseId) return alert("Select an exercise first!");

    sessionActiveRef.current = true;
    startTimeRef.current = Date.now();
    repStateRef.current = "UP";
    repetitionsDataRef.current = [];
    setRepCount(0);

    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.current.srcObject = stream;
    videoRef.current.play();
    detectFrame();
  };

  const handleStop = () => {
    sessionActiveRef.current = false;
    const video = videoRef.current;
    if (video && video.srcObject) {
      video.srcObject.getTracks().forEach(track => track.stop());
      video.srcObject = null;
    }
    setPostureFeedback("Session stopped!");
  };

  return (
    <div className="exercise-page container">
      <div className="row g-4">
        <div className="col-lg-7">
          <div className="video-container">
            <video ref={videoRef} autoPlay muted playsInline />
            <canvas ref={overlayRef} />
          </div>
        </div>
        <div className="col-lg-5">
          <div className="glass-card">
            <h2>🏋️ Exercise Info</h2>
            <select onChange={e => setSelectedExerciseId(e.target.value)} value={selectedExerciseId || ""}>
              <option value="">Select Exercise</option>
              {exercises.map(ex => (
                <option key={ex.exercise_id} value={ex.exercise_id}>{ex.exercise_name}</option>
              ))}
            </select>
            <div className="glass-card-inner mt-3">
              <p><strong>Description:</strong> {exerciseInfo.description}</p>
              <p><strong>Target Muscle:</strong> {exerciseInfo.target_muscle}</p>
              <p><strong>Difficulty:</strong> {exerciseInfo.difficulty_level}</p>
            </div>
            <div className="feedback-section mt-3">
              <p>{postureFeedback}</p>
              <p>Reps: {repCount}</p>
              <p>Time: {sessionTime}s</p>
              <p>Accuracy: {postureAccuracy}%</p>
            </div>
            <button className="glass-btn-start" onClick={handleStart}>Start</button>
            <button className="glass-btn-stop" onClick={handleStop}>Stop</button>
            {exerciseInfo.video_demo_url && <video src={exerciseInfo.video_demo_url} controls width="100%" />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Exercises;
