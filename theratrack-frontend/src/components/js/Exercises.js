import * as tf from "@tensorflow/tfjs";
import * as poseDetection from "@tensorflow-models/pose-detection";

export const initDetector = async () => {
  await tf.setBackend("webgl");
  await tf.ready();
  const detector = await poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet
  );
  return detector;
};

export const getAngle = (a, b, c) => {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const magAB = Math.sqrt(ab.x ** 2 + ab.y ** 2);
  const magCB = Math.sqrt(cb.x ** 2 + cb.y ** 2);
  return (Math.acos(dot / (magAB * magCB)) * 180) / Math.PI;
};

export const smoothKeypoints = (history, keypoints, maxFrames = 5) => {
  history.push(keypoints);
  if (history.length > maxFrames) history.shift();
  return keypoints.map((kp, idx) => {
    let avgX = 0, avgY = 0, avgScore = 0;
    history.forEach(frame => { avgX += frame[idx].x; avgY += frame[idx].y; avgScore += frame[idx].score; });
    const n = history.length;
    return { ...kp, x: avgX / n, y: avgY / n, score: avgScore / n };
  });
};
