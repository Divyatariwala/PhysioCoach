export function analyzeLunge(landmarks, state) {
    const RIGHT_HIP = 24, RIGHT_KNEE = 26, RIGHT_ANKLE = 28;
    const LEFT_HIP = 23, LEFT_KNEE = 25, LEFT_ANKLE = 27;

    let rightKneeAngle = calculateAngle(landmarks[RIGHT_HIP], landmarks[RIGHT_KNEE], landmarks[RIGHT_ANKLE]);
    let leftKneeAngle = calculateAngle(landmarks[LEFT_HIP], landmarks[LEFT_KNEE], landmarks[LEFT_ANKLE]);

    let avgKnee = (rightKneeAngle + leftKneeAngle) / 2;

    if (avgKnee < 100 && !state.down) {
        state.down = true;
        state.feedback = "Lunge down detected, push up!";
    }
    if (avgKnee > 160 && state.down) {
        state.down = false;
        state.count += 1;
        state.feedback = `Lunges: ${state.count}`;
    }

    if (rightKneeAngle < 70 || leftKneeAngle < 70) {
        state.feedback = "Don’t drop knee too low!";
    }

    // Always show feedback
    document.getElementById("feedback").innerText = state.feedback;
}
