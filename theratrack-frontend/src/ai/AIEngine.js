export class AIEngine {
    constructor(exerciseName) {
        this.setExercise(exerciseName);
    }

    // ================= SETUP =================
    setExercise(name) {
        this.exercise = name.toLowerCase();

        this.started = false;

        // movement state
        this.stage = "idle"; // idle → down → up

        // rep control
        this.lastRepTime = 0;
        this.cooldown = 700;

        // accuracy smoothing
        this.repAccuracyBuffer = [];
    }

    reset(name) {
        this.setExercise(name);
    }

    async loadModel() {
        return true;
    }

    // ================= UTILITIES =================
    getKeypoint(kps, name) {
        return kps.find(k => k.name === name);
    }

    isVisible(kp) {
        return kp && kp.score > 0.35;
    }

    getAngle(A, B, C) {
        const AB = { x: A.x - B.x, y: A.y - B.y };
        const CB = { x: C.x - B.x, y: C.y - B.y };

        const dot = AB.x * CB.x + AB.y * CB.y;
        const magAB = Math.hypot(AB.x, AB.y);
        const magCB = Math.hypot(CB.x, CB.y);

        if (!magAB || !magCB) return 180;

        return (Math.acos(dot / (magAB * magCB)) * 180) / Math.PI;
    }

    // ================= READY CHECK =================
    isUserReady(kps) {
        const required = [
            "left_shoulder",
            "right_shoulder",
            "left_hip",
            "right_hip"
        ];

        return required.every(n => this.isVisible(this.getKeypoint(kps, n)));
    }

    // =========================================================
    // SQUATS 
    // =========================================================
    analyzeSquat(kps) {
        const lh = this.getKeypoint(kps, "left_hip");
        const rh = this.getKeypoint(kps, "right_hip");
        const lk = this.getKeypoint(kps, "left_knee");
        const rk = this.getKeypoint(kps, "right_knee");
        const la = this.getKeypoint(kps, "left_ankle");
        const ra = this.getKeypoint(kps, "right_ankle");
        const ls = this.getKeypoint(kps, "left_shoulder");
        const rs = this.getKeypoint(kps, "right_shoulder");

        if (![lh, rh, lk, rk, la, ra, ls, rs].every(kp => this.isVisible(kp))) {
            return {
                feedback: "Step back - show full body clearly 👤",
                accuracy: 0,
                repCompleted: false
            };
        }

        const kneeAngle =
            (this.getAngle(lh, lk, la) + this.getAngle(rh, rk, ra)) / 2;

        const hipAngle =
            (this.getAngle(ls, lh, lk) + this.getAngle(rs, rh, rk)) / 2;

        let repCompleted = false;
        let feedback = "Keep going";
        let accuracyBoost = 85;

        // ================= POSTURE CHECKS =================

        // Leaning forward too much
        if (hipAngle < 150) {
            feedback = "Keep your chest up 🧍‍♂️";
            accuracyBoost -= 10;
        }

        // Knees collapsing / unstable
        const kneeDistance = Math.abs(lk.x - rk.x);
        const hipDistance = Math.abs(lh.x - rh.x);

        if (kneeDistance < hipDistance * 0.7) {
            feedback = "Push knees outward slightly 🦵";
            accuracyBoost -= 10;
        }

        // Not going low enough
        if (kneeAngle > 140 && this.stage === "up") {
            feedback = "Go lower for full squat ⬇️";
            accuracyBoost -= 5;
        }

        // ================= MOVEMENT LOGIC =================

        // DOWN position
        if (kneeAngle < 135) {
            this.stage = "down";
            feedback = feedback.includes("Keep") ? "Go up 🔼" : feedback;
            this.repAccuracyBuffer.push(85);
        }

        // UP position → REP COMPLETE
        if (kneeAngle > 160 && this.stage === "down") {
            const now = Date.now();

            if (now - this.lastRepTime > this.cooldown) {
                this.stage = "up";
                this.lastRepTime = now;

                repCompleted = true;
                feedback = "Nice squat! ✅";
                this.repAccuracyBuffer.push(95);
            }
        }

        // ================= ACCURACY =================
        const baseAccuracy =
            this.repAccuracyBuffer.length > 0
                ? this.repAccuracyBuffer.reduce((a, b) => a + b, 0) /
                this.repAccuracyBuffer.length
                : 85;

        const accuracy = Math.max(0, Math.min(100, baseAccuracy + (accuracyBoost - 85)));

        if (repCompleted) this.repAccuracyBuffer = [];

        return {
            feedback,
            accuracy: Math.round(accuracy),
            repCompleted
        };
    }

    // =========================================================
    // BICEP CURLS
    // =========================================================
    analyzeBicep(kps) {
        const rs = this.getKeypoint(kps, "right_shoulder");
        const re = this.getKeypoint(kps, "right_elbow");
        const rw = this.getKeypoint(kps, "right_wrist");

        const ls = this.getKeypoint(kps, "left_shoulder");
        const le = this.getKeypoint(kps, "left_elbow");
        const lw = this.getKeypoint(kps, "left_wrist");

        const lh = this.getKeypoint(kps, "left_hip");
        const rh = this.getKeypoint(kps, "right_hip");

        // ------------------------------
        // PICK ACTIVE ARM (left or right)
        // ------------------------------
        const rightVisible = [rs, re, rw].every(kp => this.isVisible(kp));
        const leftVisible = [ls, le, lw].every(kp => this.isVisible(kp));

        let s, e, w, side;

        if (rightVisible && !leftVisible) {
            s = rs; e = re; w = rw;
            side = "right";
        } else if (leftVisible && !rightVisible) {
            s = ls; e = le; w = lw;
            side = "left";
        } else if (leftVisible && rightVisible) {
            // choose better visible elbow
            const rightScore = rs.score + re.score + rw.score;
            const leftScore = ls.score + le.score + lw.score;

            if (leftScore > rightScore) {
                s = ls; e = le; w = lw;
                side = "left";
            } else {
                s = rs; e = re; w = rw;
                side = "right";
            }
        } else {
            return {
                feedback: "Show at least one full arm 👤",
                accuracy: 0,
                repCompleted: false
            };
        }

        // ------------------------------
        // ANGLE CALCULATION
        // ------------------------------
        const angle = this.getAngle(s, e, w);

        let repCompleted = false;
        let feedback = `${side} arm: keep going 💪`;
        let penalty = 0;

        // ------------------------------
        // FORM CHECKS (IMPORTANT)
        // ------------------------------

        // elbow drifting (bad curl form)
        const elbowDrift = Math.abs(e.x - s.x);
        if (elbowDrift > 80) {
            feedback = "Keep elbow close to body ❗";
            penalty += 20;
        }

        // shoulder lifting
        if (e.y < s.y - 20) {
            feedback = "Don't lift your shoulder 🚫";
            penalty += 15;
        }

        // body tilt check
        if (lh && rh) {
            const hipTilt = Math.abs(lh.y - rh.y);
            if (hipTilt > 30) {
                feedback = "Keep your body straight 🧍";
                penalty += 10;
            }
        }

        // ------------------------------
        // REP LOGIC
        // ------------------------------

        // CURL UP
        if (angle < 55) {
            this.stage = "up";
            feedback = penalty > 0
                ? `${side} arm curl - fix form ⚠️`
                : `${side} arm curl up 💪`;

            this.repAccuracyBuffer.push(90);
        }

        // CURL DOWN → REP COMPLETE
        if (angle > 160) {
            const now = Date.now();

            if (this.stage === "up" && now - this.lastRepTime > this.cooldown) {
                this.stage = "down";
                this.lastRepTime = now;

                repCompleted = true;

                feedback = penalty > 0
                    ? `${side} rep done - fix form ⚠️`
                    : `${side} perfect rep ✅`;

                this.repAccuracyBuffer.push(95);
            }
        }

        // ------------------------------
        // ACCURACY
        // ------------------------------
        let baseAccuracy =
            this.repAccuracyBuffer.length > 0
                ? this.repAccuracyBuffer.reduce((a, b) => a + b, 0) /
                this.repAccuracyBuffer.length
                : 85;

        const accuracy = Math.max(0, Math.round(baseAccuracy - penalty));

        if (repCompleted) this.repAccuracyBuffer = [];

        return {
            feedback,
            accuracy,
            repCompleted
        };
    }

    // =========================================================
    // SIDE LEG RAISE
    // =========================================================
    analyzeSideLeg(kps) {
        const lh = this.getKeypoint(kps, "left_hip");
        const rh = this.getKeypoint(kps, "right_hip");
        const lk = this.getKeypoint(kps, "left_knee");
        const rk = this.getKeypoint(kps, "right_knee");
        const la = this.getKeypoint(kps, "left_ankle");
        const ra = this.getKeypoint(kps, "right_ankle");

        if (![lh, rh, lk, rk, la, ra].every(kp => this.isVisible(kp))) {
            return {
                feedback: "Step back - full body not visible 👤",
                accuracy: 0,
                repCompleted: false
            };
        }

        // =========================
        // LEFT LEG MOVEMENT
        // =========================
        const leftHorizontal = Math.abs(la.x - lh.x);
        const leftVertical = lh.y - la.y; // upward lift

        // =========================
        // RIGHT LEG MOVEMENT
        // =========================
        const rightHorizontal = Math.abs(ra.x - rh.x);
        const rightVertical = rh.y - ra.y;

        // =========================
        // DETERMINE ACTIVE LEG (IMPORTANT FIX)
        // =========================
        let side = "left";
        let movement = leftHorizontal + leftVertical;

        if ((rightHorizontal + rightVertical) > movement) {
            side = "right";
            movement = rightHorizontal + rightVertical;
        }

        let repCompleted = false;
        let feedback = `${side} leg raise ➡️`;
        let penalty = 0;

        // =========================
        // FORM CHECKS
        // =========================

        // 1. Not lifting enough sideways
        if (movement < 40) {
            feedback = "Lift leg higher sideways ➡️";
            penalty += 15;
        }

        // 2. Hip tilt (VERY IMPORTANT for side leg raises)
        const hipTilt = Math.abs(lh.y - rh.y);
        if (hipTilt > 25) {
            feedback = "Keep hips stable 🧍";
            penalty += 15;
        }

        // 3. Leaning body (upper body control)
        const shoulderCheck = this.getKeypoint(kps, "left_shoulder");
        const shoulderCheck2 = this.getKeypoint(kps, "right_shoulder");

        if (this.isVisible(shoulderCheck) && this.isVisible(shoulderCheck2)) {
            const shoulderTilt = Math.abs(shoulderCheck.y - shoulderCheck2.y);
            if (shoulderTilt > 25) {
                feedback = "Keep upper body straight 🧍‍♂️";
                penalty += 10;
            }
        }

        // =========================
        // REP LOGIC
        // =========================

        // LEG UP (extended position)
        if (movement > 70) {
            if (this.stage !== "up") {
                this.stage = "up";
                feedback = `${side} leg extended ➡️`;
                this.repAccuracyBuffer.push(90);
            }
        }

        // LEG DOWN (back to neutral)
        if (movement < 25) {
            const now = Date.now();

            if (this.stage === "up" && now - this.lastRepTime > this.cooldown) {
                this.stage = "down";
                this.lastRepTime = now;

                repCompleted = true;
                feedback = `${side} rep completed ✅`;
                this.repAccuracyBuffer.push(95);
            }
        }

        // =========================
        // ACCURACY
        // =========================
        const baseAccuracy =
            this.repAccuracyBuffer.length > 0
                ? this.repAccuracyBuffer.reduce((a, b) => a + b, 0) /
                this.repAccuracyBuffer.length
                : 85;

        const accuracy = Math.max(0, Math.min(100, baseAccuracy - penalty));

        if (repCompleted) this.repAccuracyBuffer = [];

        return {
            feedback,
            accuracy: Math.round(accuracy),
            repCompleted
        };
    }

    // =========================================================
    // MAIN FUNCTION
    // =========================================================
    analyze({ keypoints }) {
        if (!this.started) {
            if (this.isUserReady(keypoints)) {
                this.started = true;
                this.stage = "up";

                return {
                    feedback: "Start exercise 🏋️",
                    accuracy: 100,
                    repCompleted: false
                };
            }

            return {
                feedback: "Get in frame 👤",
                accuracy: 0,
                repCompleted: false
            };
        }

        if (this.exercise === "squats") {
            return this.analyzeSquat(keypoints);
        }

        if (this.exercise === "bicep curls") {
            return this.analyzeBicep(keypoints);
        }

        if (this.exercise === "side leg raises") {
            return this.analyzeSideLeg(keypoints);
        }

        return {
            feedback: "Unsupported exercise",
            accuracy: 0,
            repCompleted: false
        };
    }
}