export const runRuleEngine = (features, exercise) => {
  const name = exercise?.toLowerCase();

  if (!features) {
    return { label: "incorrect", message: "No features detected" };
  }

  const {
    kneeAngle,
    hipAngle,
    elbowAngle,
    legRaiseAngle,
    posture_stability,
    visibilityScore
  } = features;

  // ---------------- GLOBAL CHECKS ----------------
  if (visibilityScore < 0.5) {
    return {
      label: "incorrect",
      message: "📷 Move back — body not fully visible"
    };
  }

  if (posture_stability < 0.3) {
    return {
      label: "incorrect",
      message: "⚠️ Too much movement — hold steady"
    };
  }

  // ---------------- SQUATS ----------------
  if (name === "squats") {
    if (!kneeAngle || !hipAngle) {
      return { label: "incorrect", message: "⚠️ Pose not visible properly" };
    }

    if (kneeAngle > 170) {
      return { label: "correct", message: "⬇️ Start squatting" };
    }

    if (kneeAngle > 140) {
      return { label: "incorrect", message: "⬇️ Go lower" };
    }

    if (kneeAngle < 50) {
      return { label: "incorrect", message: "⚠️ Too deep — rise slightly" };
    }

    if (hipAngle < 70) {
      return { label: "incorrect", message: "🧍 Push hips back" };
    }

    if (kneeAngle >= 70 && kneeAngle <= 130) {
      return { label: "correct", message: "🧍 Good squat form" };
    }

    return { label: "incorrect", message: "🧍 Adjust squat position" };
  }

  // ---------------- BICEP CURLS ----------------
  if (name === "bicep curls") {
    if (!elbowAngle) {
      return { label: "incorrect", message: "💪 Adjust arm visibility" };
    }

    if (elbowAngle > 160) {
      return { label: "correct", message: "⬇️ Start curling" };
    }

    if (elbowAngle < 40) {
      return { label: "correct", message: "⬆️ Lower slowly" };
    }

    if (posture_stability < 0.5) {
      return { label: "incorrect", message: "⚠️ Avoid swinging body" };
    }

    if (elbowAngle >= 50 && elbowAngle <= 120) {
      return { label: "correct", message: "💪 Good curl form" };
    }

    return { label: "incorrect", message: "💪 Control your movement" };
  }

  // ---------------- SIDE LEG RAISES ----------------
  if (name === "side leg raises") {
    if (!legRaiseAngle || !hipAngle) {
      return { label: "incorrect", message: "⚠️ Full body not visible" };
    }

    if (legRaiseAngle > 160) {
      return { label: "correct", message: "⬆️ Lift your leg to the side" };
    }

    if (posture_stability < 0.6) {
      return { label: "incorrect", message: "🧍 Keep hips stable" };
    }

    if (legRaiseAngle >= 80 && legRaiseAngle <= 120) {
      return { label: "correct", message: "🦵 Good form!" };
    }

    if (legRaiseAngle > 120) {
      return { label: "incorrect", message: "⬆️ Raise your leg higher" };
    }

    if (legRaiseAngle < 80) {
      return { label: "incorrect", message: "⚠️ Too high or leaning — control movement" };
    }

    return { label: "incorrect", message: "🦵 Control your leg movement" };
  }

  return {
    label: "correct",
    message: "Keep going 💪"
  };
};