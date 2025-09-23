export function analyzePushup(landmarks, state) {
    const LEFT_SHOULDER = 11, LEFT_ELBOW = 13, LEFT_WRIST = 15;
    const RIGHT_SHOULDER = 12, RIGHT_ELBOW = 14, RIGHT_WRIST = 16;

    let leftAngle = calculateAngle(landmarks[LEFT_SHOULDER], landmarks[LEFT_ELBOW], landmarks[LEFT_WRIST]);
    let rightAngle = calculateAngle(landmarks[RIGHT_SHOULDER], landmarks[RIGHT_ELBOW], landmarks[RIGHT_WRIST]);

    let avgElbow = (leftAngle + rightAngle) / 2;

    if (avgElbow < 90 && !state.down) {
        state.down = true;
        state.feedback = "Push-up down detected, push up!";
    }
    if (avgElbow > 160 && state.down) {
        state.down = false;
        state.count += 1;
        state.feedback = `Push-ups: ${state.count}`;
    }

    if (avgElbow > 170) {
        state.feedback += " | Keep arms slightly bent, don’t lock elbows!";
    }

    // Always show feedback
    document.getElementById("feedback").innerText = state.feedback;
}
