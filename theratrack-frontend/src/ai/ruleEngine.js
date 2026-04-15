export const runRuleEngine = (features, exercise) => {
  const name = exercise?.toLowerCase();

  if (!features) return "No features detected";

  // ---------------- SQUATS ----------------
  if (name === "squats") {
    const knee = features.kneeAngle;
    const hip = features.hipAngle;

    if (!knee || !hip) return "⚠️ Pose not visible properly";

    if (knee > 165) return "⬇️ You are not squatting enough (go lower)";
    if (knee < 70) return "⚠️ Too deep squat (risk of injury)";
    if (hip < 80) return "🧍 Keep hips back while squatting";

    return "🧍 Fix squat alignment";
  }

  // ---------------- BICEP CURLS ----------------
  if (name === "bicep curls") {
    const angle = features.elbowAngle;

    if (!angle) return "💪 Adjust arm visibility";

    if (angle > 160) return "⬇️ Start curling (bend elbow)";
    if (angle < 40) return "⬆️ Fully extend arm slowly";
    if (features.bodyBalance < 0.5) return "⚠️ Avoid swinging body";

    return "💪 Improve curl control";
  }

  // ---------------- SIDE LEG RAISES ----------------
  if (name === "side leg raises") {
    const angle = features.legRaiseAngle;

    if (!angle) return "🦵 Position sideways properly";

    if (angle > 165) return "⬆️ Lift your leg higher";
    if (angle < 120) return "⚠️ Too high / unstable movement";
    if (features.posture_stability < 0.6)
      return "🧍 Keep hips stable";

    return "🦵 Improve balance and control";
  }

  return "Keep going 💪";
};