import { getAngle, getKeypoint } from "./helpers";

export const extractFeatures = (keypoints) => {
  const kp = (name) => getKeypoint(keypoints, name);

  // ---- SQUAT ----
  const squatAngle = kp("left_hip") && kp("left_knee") && kp("left_ankle")
    ? getAngle(kp("left_hip"), kp("left_knee"), kp("left_ankle"))
    : null;

  const squatAngleR = kp("right_hip") && kp("right_knee") && kp("right_ankle")
    ? getAngle(kp("right_hip"), kp("right_knee"), kp("right_ankle"))
    : null;

  // ---- BICEP CURL ----
  const bicepAngle = kp("right_shoulder") && kp("right_elbow") && kp("right_wrist")
    ? getAngle(kp("right_shoulder"), kp("right_elbow"), kp("right_wrist"))
    : null;

  const bicepAngleL = kp("left_shoulder") && kp("left_elbow") && kp("left_wrist")
    ? getAngle(kp("left_shoulder"), kp("left_elbow"), kp("left_wrist"))
    : null;

  // ---- SIDE LEG RAISE ----
  const legLift = kp("left_hip") && kp("left_knee")
    ? Math.abs(kp("left_hip").y - kp("left_knee").y)
    : null;

  return {
    squatAngle: (squatAngle + squatAngleR) / 2,
    bicepAngle: (bicepAngle + bicepAngleL) / 2,
    legLift
  };
};