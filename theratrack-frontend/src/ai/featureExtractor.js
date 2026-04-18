export const extractFeatures = (
  keypoints,
  side = "left",
  prevKeypoints = []
) => {
  const get = (name) => keypoints.find(k => k.name === name);

  const calculateAngle = (a, b, c) => {
    if (!a || !b || !c) return 0;

    const AB = { x: a.x - b.x, y: a.y - b.y };
    const CB = { x: c.x - b.x, y: c.y - b.y };

    const dot = AB.x * CB.x + AB.y * CB.y;
    const magAB = Math.sqrt(AB.x ** 2 + AB.y ** 2);
    const magCB = Math.sqrt(CB.x ** 2 + CB.y ** 2);

    const angle = Math.acos(dot / (magAB * magCB)) * (180 / Math.PI);
    return isNaN(angle) ? 0 : angle;
  };

  // ---------------- JOINTS ----------------
  const hip = get(`${side}_hip`);
  const knee = get(`${side}_knee`);
  const ankle = get(`${side}_ankle`);

  const shoulder = get(`${side}_shoulder`);
  const elbow = get(`${side}_elbow`);
  const wrist = get(`${side}_wrist`);

  // fallback if side missing
  const safeHip = hip || get("left_hip") || get("right_hip");
  const safeKnee = knee || get("left_knee") || get("right_knee");
  const safeAnkle = ankle || get("left_ankle") || get("right_ankle");
  const safeShoulder = shoulder || get("left_shoulder") || get("right_shoulder");

  // ---------------- ANGLES ----------------
  const kneeAngle = calculateAngle(safeHip, safeKnee, safeAnkle);
  const hipAngle = calculateAngle(safeShoulder, safeHip, safeKnee);

  // ---------------- BICEP CURL (SMART ARM SELECTION) ----------------
  const leftElbowAngle = calculateAngle(
    get("left_shoulder"),
    get("left_elbow"),
    get("left_wrist")
  );

  const rightElbowAngle = calculateAngle(
    get("right_shoulder"),
    get("right_elbow"),
    get("right_wrist")
  );

  const leftScore = get("left_elbow")?.score || 0;
  const rightScore = get("right_elbow")?.score || 0;

  let elbowAngle = 0;

  if (leftScore > 0.4 && rightScore > 0.4) {
    elbowAngle = (leftElbowAngle + rightElbowAngle) / 2;
  } else if (leftScore > rightScore) {
    elbowAngle = leftElbowAngle;
  } else {
    elbowAngle = rightElbowAngle;
  }

  // ---------------- SIDE LEG RAISE ----------------
  const legRaiseAngle = calculateAngle(
    safeShoulder,
    safeHip,
    safeAnkle
  );

  // =========================================================
  // 🔥 NEW: VISIBILITY SCORE
  // =========================================================
  const visibleKeypoints = keypoints.filter(kp => kp.score > 0.4).length;
  const visibilityScore = visibleKeypoints / keypoints.length;

  // =========================================================
  // 🔥 NEW: POSTURE STABILITY (movement detection)
  // =========================================================
  let movement = 0;

  if (prevKeypoints && prevKeypoints.length === keypoints.length) {
    for (let i = 0; i < keypoints.length; i++) {
      const kp = keypoints[i];
      const prev = prevKeypoints[i];

      if (kp && prev) {
        movement += Math.hypot(kp.x - prev.x, kp.y - prev.y);
      }
    }
  }

  // normalize (tune this value if needed)
  const posture_stability = Math.max(0, 1 - movement / 2000);

  // ---------------- RETURN ----------------
  return {
    kneeAngle,
    hipAngle,
    elbowAngle,
    legRaiseAngle,

    visibilityScore,
    posture_stability
  };
};