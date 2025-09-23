// exercise_logic.js
import { analyzeSquat } from './squat.js';
import { analyzePushup } from './pushup.js';
import { analyzeLunge } from './lunge.js';

// CSRF helper
function getCSRFToken() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') : '';
}

// Exercise state
export const exerciseState = {
    squat: { count: 0, down: false, feedback: "" },
    pushup: { count: 0, down: false, feedback: "" },
    lunge: { count: 0, down: false, feedback: "" }
};

export let currentExercise = "squat"; // default

document.addEventListener("DOMContentLoaded", () => {
    const dropdown = document.getElementById("exerciseSelect");
    dropdown.addEventListener("change", (e) => {
        currentExercise = e.target.value;
        exerciseState[currentExercise].count = 0;
        exerciseState[currentExercise].down = false;
        exerciseState[currentExercise].feedback = "";
        const feedbackEl = document.getElementById("feedback");
        if (feedbackEl) feedbackEl.innerText = `Switched to ${currentExercise}. Start your reps!`;
    });
});

// Shared utility: calculate angle between 3 points
export function calculateAngle(a, b, c) {
    const ab = { x: b.x - a.x, y: b.y - a.y };
    const cb = { x: b.x - c.x, y: b.y - c.y };
    const dot = ab.x * cb.x + ab.y * cb.y;
    const mag = Math.sqrt(ab.x**2 + ab.y**2) * Math.sqrt(cb.x**2 + cb.y**2);
    const cosine = Math.min(Math.max(dot / mag, -1), 1);
    return Math.acos(cosine) * (180 / Math.PI);
}

// Smooth angles for stability
let angleBufferLeft = [];
let angleBufferRight = [];
const bufferSize = 5;
export function smoothAngle(left, right) {
    angleBufferLeft.push(left);
    angleBufferRight.push(right);
    if (angleBufferLeft.length > bufferSize) angleBufferLeft.shift();
    if (angleBufferRight.length > bufferSize) angleBufferRight.shift();
    const avgLeft = angleBufferLeft.reduce((a,b)=>a+b,0)/angleBufferLeft.length;
    const avgRight = angleBufferRight.reduce((a,b)=>a+b,0)/angleBufferRight.length;
    return [avgLeft, avgRight];
}

// Main analyzer
export function analyzeExercise(landmarks) {
    const state = exerciseState[currentExercise];
    switch(currentExercise){
        case "squat": analyzeSquat(landmarks, state); break;
        case "pushup": analyzePushup(landmarks, state); break;
        case "lunge": analyzeLunge(landmarks, state); break;
    }

    // Update feedback element
    const feedbackEl = document.getElementById("feedback");
    if (feedbackEl) feedbackEl.innerText = state.feedback;

    // DO NOT save reps here — let stopCamera() handle it
}

