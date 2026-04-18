export const runRuleEngine = (features, exercise) => {
  const name = exercise?.toLowerCase();

  if (!features) return "No features detected";

  const {
    kneeAngle,
    hipAngle,
    elbowAngle,
    legRaiseAngle,
    posture_stability,
    visibilityScore
  } = features;

  // ==================================================
  // ---------------- GLOBAL CHECKS ----------------
  // ==================================================
  if (visibilityScore < 0.5) {
    return "📷 Move back — body not fully visible";
  }

  if (posture_stability < 0.3) {
    return "⚠️ Too much movement — hold steady";
  }

  // ==================================================
  // ---------------- SQUATS ----------------
  // ==================================================
  if (name === "squats") {
    if (!kneeAngle || !hipAngle)
      return "⚠️ Pose not visible properly";

    // 🧍 Standing (top)
    if (kneeAngle > 170)
      return "⬇️ Start squatting";

    // ⬇️ Not deep enough
    if (kneeAngle > 140)
      return "⬇️ Go lower";

    // ⚠️ Too deep (very low only)
    if (kneeAngle < 50)
      return "⚠️ Too deep — rise slightly";

    // 🧍 Hip position
    if (hipAngle < 70)
      return "🧍 Push hips back";

    // ⚠️ Knees collapsing (optional if you add feature later)
    // if (features.kneeInward > threshold) return "⚠️ Keep knees aligned";

    // ✅ GOOD ZONE (wide tolerance)
    if (kneeAngle >= 70 && kneeAngle <= 130) {
      return "🧍 Good squat form";
    }

    return "🧍 Adjust squat position";
  }

  // ==================================================
  // ---------------- BICEP CURLS ----------------
  // ==================================================
  if (name === "bicep curls") {
    if (!elbowAngle)
      return "💪 Adjust arm visibility";

    // starting (arm straight)
    if (elbowAngle > 160)
      return "⬇️ Start curling";

    // fully contracted
    if (elbowAngle < 40)
      return "⬆️ Lower slowly";

    // ⚠️ body swing
    if (posture_stability < 0.5)
      return "⚠️ Avoid swinging body";

    // ✅ GOOD RANGE
    if (elbowAngle >= 50 && elbowAngle <= 120) {
      return "💪 Good curl form";
    }

    return "💪 Control your movement";
  }

  // ==================================================
  // ---------------- SIDE LEG RAISES ----------------
  // ==================================================
  if (name === "side leg raises") {
    if (!legRaiseAngle || !hipAngle)
      return "⚠️ Full body not visible";

    // 🧍 standing (leg down)
    if (legRaiseAngle > 160)
      return "⬆️ Lift your leg to the side";

    // ⚠️ instability FIRST (always important)
    if (posture_stability < 0.6)
      return "🧍 Keep hips stable";

    // ✅ GOOD RANGE (waist height sideways lift)
    if (legRaiseAngle >= 80 && legRaiseAngle <= 120) {
      return "🦵 Good form!";
    }

    // ⬆️ not high enough
    if (legRaiseAngle > 120 && legRaiseAngle <= 160)
      return "⬆️ Raise your leg higher";

    // ⚠️ too high / leaning / incorrect plane
    if (legRaiseAngle < 80)
      return "⚠️ Too high or leaning — control movement";

    return "🦵 Control your leg movement";
  }

  // ==================================================
  // ---------------- DEFAULT ----------------
  // ==================================================
  return "Keep going 💪";
};