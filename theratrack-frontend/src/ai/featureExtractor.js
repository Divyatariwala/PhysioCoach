export const getAngle = (a, b, c) => {
  const ab = [a.x - b.x, a.y - b.y];
  const cb = [c.x - b.x, c.y - b.y];

  const dot = ab[0] * cb[0] + ab[1] * cb[1];
  const magAB = Math.sqrt(ab[0] ** 2 + ab[1] ** 2);
  const magCB = Math.sqrt(cb[0] ** 2 + cb[1] ** 2);

  return Math.acos(dot / (magAB * magCB)) * (180 / Math.PI);
};

export const getKeypoint = (keypoints, name) =>
  keypoints.find(k => k.name === name);

export const extractFeatures = (keypoints) => {
  const hip = getKeypoint(keypoints, "left_hip");
  const knee = getKeypoint(keypoints, "left_knee");
  const ankle = getKeypoint(keypoints, "left_ankle");

  const shoulder = getKeypoint(keypoints, "left_shoulder");
  const elbow = getKeypoint(keypoints, "left_elbow");
  const wrist = getKeypoint(keypoints, "left_wrist");

  if (!hip || !knee || !ankle || !shoulder || !elbow || !wrist) return null;

  const kneeAngle = getAngle(hip, knee, ankle);
  const elbowAngle = getAngle(shoulder, elbow, wrist);

  return { kneeAngle, elbowAngle };
};