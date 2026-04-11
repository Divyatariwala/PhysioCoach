import * as tf from "@tensorflow/tfjs";
import { extractFeatures } from "./featureExtractor";

export class AIEngine {
  constructor(exercise) {
    this.exercise = exercise.toLowerCase();
    this.model = null;
    this.repState = "UP";
  }

  async loadModel() {
    try {
      this.model = await tf.loadLayersModel("/models/exercise_model/model.json");
      console.log("✅ AI Model Loaded");
    } catch (err) {
      console.warn("Using fallback logic (no model)");
    }
  }

  async predict() {
    // fallback score (since model may not exist yet)
    return 0.8;
  }

  async analyze(pose) {
    const features = extractFeatures(pose.keypoints);
    if (!features) return null;

    const { kneeAngle, elbowAngle } = features;

    const confidence = await this.predict();
    const accuracy = Math.round(confidence * 100);

    let feedback = "";
    let repCompleted = false;

    // ---------------- SQUATS ----------------
    if (this.exercise === "squats") {
      if (kneeAngle > 160) feedback = "Stand tall 👍";
      else if (kneeAngle > 120) feedback = "Go lower ⬇️";
      else if (kneeAngle > 90) feedback = "Good depth 💪";
      else feedback = "Perfect squat 🔥";

      if (kneeAngle < 100 && this.repState === "UP") {
        this.repState = "DOWN";
      }

      if (kneeAngle > 160 && this.repState === "DOWN") {
        this.repState = "UP";
        repCompleted = true;
      }
    }

    // ---------------- BICEP CURLS ----------------
    else if (this.exercise === "bicep curls") {
      if (elbowAngle < 50) feedback = "Great contraction 💪";
      else if (elbowAngle < 100) feedback = "Good curl 👍";
      else feedback = "Lift higher ⬆️";

      if (elbowAngle < 60 && this.repState === "DOWN") {
        this.repState = "UP";
      }

      if (elbowAngle > 150 && this.repState === "UP") {
        this.repState = "DOWN";
        repCompleted = true;
      }
    }

    // ---------------- SIDE LEG RAISES ----------------
    else if (this.exercise === "side leg raises") {
      if (kneeAngle > 150) feedback = "Excellent raise 🔥";
      else if (kneeAngle > 120) feedback = "Good 👍";
      else feedback = "Raise higher ⬆️";

      if (kneeAngle > 150 && this.repState === "DOWN") {
        this.repState = "UP";
      }

      if (kneeAngle < 120 && this.repState === "UP") {
        this.repState = "DOWN";
        repCompleted = true;
      }
    }

    return { accuracy, feedback, repCompleted };
  }
}