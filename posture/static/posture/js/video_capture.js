// video_capture.js
import { analyzeExercise, exerciseState, currentExercise } from './exercise_logic.js';

let captureInterval;
let videoStream;
let cameraActive = false;

function getCSRFToken() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') : '';
}

export function startCamera() {
    const video = document.getElementById('video');
    const feedback = document.getElementById('feedback');

    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            video.srcObject = stream;
            videoStream = stream;
            cameraActive = true;

            video.onloadedmetadata = () => {
                video.play();
                if (feedback) feedback.innerText = "Workout started!";
                captureInterval = setInterval(() => captureFrame(video), 200); // 5 FPS
            };
        })
        .catch(err => {
            console.error("Error accessing camera:", err);
            if (feedback) feedback.innerText = "Cannot access camera. Please allow camera access.";
        });
}

export function stopCamera() {
    clearInterval(captureInterval);
    const video = document.getElementById('video');
    const overlay = document.getElementById('overlay');
    const feedback = document.getElementById('feedback');

    if (videoStream) videoStream.getTracks().forEach(track => track.stop());
    cameraActive = false;

    if (overlay) {
        const ctx = overlay.getContext('2d');
        ctx.clearRect(0, 0, overlay.width, overlay.height);
    }
    
    if (feedback) feedback.innerText = "Workout stopped.";

    // Save record if reps counted
    const state = exerciseState[currentExercise];
    if (currentExercise && state.count > 0) {
        console.log("Saving reps to DB:", currentExercise, state.count);
        fetch("/save_exercise_record/", {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-CSRFToken": getCSRFToken() },
            body: JSON.stringify({ exercise_type: currentExercise, reps: state.count })
        })
        .then(res => res.json())
        .then(data => { 
            if (data.success) console.log("Exercise record saved!");
            else console.error("Failed to save:", data.error);
        })
        .catch(err => console.error("Error saving record:", err));
    } else {
        console.log("No reps to save.");
    }

    // Reset state
    state.count = 0;
    state.down = false;
    state.feedback = "";
}


function captureFrame(video) {
    if (!cameraActive) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    const data = canvas.toDataURL('image/jpeg');

    fetch("/analyze_pose/", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRFToken": getCSRFToken() },
        body: JSON.stringify({ frame: data, exercise_type: currentExercise, reps: exerciseState[currentExercise].count })
    })
    .then(res => res.json())
    .then(data => {
        if (data.landmarks && cameraActive && data.landmarks.length >= 33) {
            drawLandmarks(data.landmarks);
            analyzeExercise(data.landmarks);
        }
    })
    .catch(err => console.error("Error fetching pose data:", err));
}

function drawLandmarks(landmarks) {
    const video = document.getElementById('video');
    const overlay = document.getElementById('overlay');
    if (!overlay || !landmarks) return;

    const ctx = overlay.getContext('2d');
    overlay.width = video.videoWidth;
    overlay.height = video.videoHeight;
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    // Draw points
    ctx.fillStyle = 'red';
    ctx.strokeStyle = 'lime';
    ctx.lineWidth = 2;
    landmarks.forEach(p => {
        if (p && typeof p.x === 'number' && typeof p.y === 'number') {
            ctx.beginPath();
            ctx.arc(p.x * overlay.width, p.y * overlay.height, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // Draw skeleton
    const connections = [
        [11,13],[13,15],[12,14],[14,16],[11,12],[23,24],[23,25],[25,27],[24,26],[26,28]
    ];
    connections.forEach(([a,b]) => {
        if (
            landmarks[a] && landmarks[b] &&
            typeof landmarks[a].x === 'number' && typeof landmarks[a].y === 'number' &&
            typeof landmarks[b].x === 'number' && typeof landmarks[b].y === 'number'
        ) {
            ctx.beginPath();
            ctx.moveTo(landmarks[a].x*overlay.width, landmarks[a].y*overlay.height);
            ctx.lineTo(landmarks[b].x*overlay.width, landmarks[b].y*overlay.height);
            ctx.stroke();
        }
    });

    // Draw reps & feedback
    const state = exerciseState[currentExercise];
    ctx.font = '24px Arial';
    ctx.fillStyle = 'lime';
    ctx.fillText(`Reps: ${state.count}`, 20, 30);
    if (state.feedback) ctx.fillText(state.feedback, 20, 60);
}

window.startCamera = startCamera;
window.stopCamera = stopCamera;
