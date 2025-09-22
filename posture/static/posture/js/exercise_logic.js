function drawLandmarks(landmarks){
    let canvas = document.getElementById("overlay");
    let ctx = canvas.getContext("2d");
    let video = document.getElementById("video");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // Draw dots
    landmarks.forEach(lm => {
        let x = lm.x * canvas.width;
        let y = lm.y * canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2*Math.PI);
        ctx.fillStyle = "red";
        ctx.fill();
    });

    // Indices
    const LEFT_SHOULDER = 11, RIGHT_SHOULDER = 12;
    const LEFT_HIP = 23, RIGHT_HIP = 24;
    const LEFT_KNEE = 25, RIGHT_KNEE = 26;

    // Get points
    let ls = landmarks[LEFT_SHOULDER], rs = landmarks[RIGHT_SHOULDER];
    let lh = landmarks[LEFT_HIP], rh = landmarks[RIGHT_HIP];

    // Calculate alignment
    let shoulder_y_diff = Math.abs(ls.y - rs.y);
    let hip_y_diff = Math.abs(lh.y - rh.y);

    // Reference lines
    ctx.strokeStyle = "#aaa";
    ctx.lineWidth = 1;
    // Shoulder reference
    ctx.beginPath();
    ctx.moveTo(0, ls.y * canvas.height);
    ctx.lineTo(canvas.width, ls.y * canvas.height);
    ctx.stroke();
    // Hip reference
    ctx.beginPath();
    ctx.moveTo(0, lh.y * canvas.height);
    ctx.lineTo(canvas.width, lh.y * canvas.height);
    ctx.stroke();

    // Color feedback
    let color = (shoulder_y_diff < 0.03 && hip_y_diff < 0.03) ? "green" : "red";

    // Draw posture lines
    function drawLine(idx1, idx2, color, width=3) {
        let p1 = landmarks[idx1];
        let p2 = landmarks[idx2];
        if (p1 && p2) {
            ctx.beginPath();
            ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
            ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
            ctx.strokeStyle = color;
            ctx.lineWidth = width;
            ctx.stroke();
        }
    }

    drawLine(LEFT_SHOULDER, RIGHT_SHOULDER, color, 4);
    drawLine(LEFT_HIP, RIGHT_HIP, color, 4);
    drawLine(LEFT_SHOULDER, LEFT_HIP, "cyan");
    drawLine(RIGHT_SHOULDER, RIGHT_HIP, "yellow");

}


let exerciseState = {
    squat: { count: 0, down: false, feedback: "" },
    pushup: { count: 0, down: false, feedback: "" },
    lunge: { count: 0, down: false, feedback: "" }
};

let currentExercise = "squat"; // Default, can switch via UI later

function analyzeExercise(landmarks) {
    switch(currentExercise){
        case "squat":
            return analyzeSquat(landmarks, exerciseState.squat);
        case "pushup":
            return analyzePushup(landmarks, exerciseState.pushup);
        case "lunge":
            return analyzeLunge(landmarks, exerciseState.lunge);
    }
}

// Utility: Calculate angle between three points
function calculateAngle(a, b, c){
    let ab = {x: b.x - a.x, y: b.y - a.y};
    let cb = {x: b.x - c.x, y: b.y - c.y};
    let dot = ab.x*cb.x + ab.y*cb.y;
    let mag = Math.sqrt(ab.x**2 + ab.y**2) * Math.sqrt(cb.x**2 + cb.y**2);
    let angle = Math.acos(dot / mag);
    return angle * (180/Math.PI);
}

// Squat example
function analyzeSquat(landmarks, state){
    const LEFT_HIP = 23, LEFT_KNEE = 25, LEFT_ANKLE = 27;
    const RIGHT_HIP = 24, RIGHT_KNEE = 26, RIGHT_ANKLE = 28;

    let leftAngle = calculateAngle(landmarks[LEFT_HIP], landmarks[LEFT_KNEE], landmarks[LEFT_ANKLE]);
    let rightAngle = calculateAngle(landmarks[RIGHT_HIP], landmarks[RIGHT_KNEE], landmarks[RIGHT_ANKLE]);

    // Detect down phase
    if(leftAngle < 100 && rightAngle < 100 && !state.down){
        state.down = true;
        state.feedback = "Go up!";
    }

    // Detect up phase
    if(leftAngle > 160 && rightAngle > 160 && state.down){
        state.down = false;
        state.count += 1;
        state.feedback = `Squats: ${state.count}`;
    }

    // Form correction
    if(leftAngle < 80 || rightAngle < 80){
        state.feedback = "Go lower to complete squat";
    }
    if(leftAngle > 180 || rightAngle > 180){
        state.feedback = "Straighten knees";
    }

    document.getElementById("feedback").innerText = state.feedback;
}

let lastRepTime = Date.now();
const idealRest = 1000; // 1 second between reps

function checkTiming(state){
    let now = Date.now();
    if(now - lastRepTime < idealRest){
        state.feedback += " | Slow down, too fast!";
    } else {
        lastRepTime = now;
    }
}
