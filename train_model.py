import os
import django
import pandas as pd
import joblib
from datetime import datetime

from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix

# ---------------- DJANGO SETUP ----------------
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "theratrack.settings")
django.setup()

from posture.models import AIModel

# ---------------- SETUP ----------------
os.makedirs("ml_models", exist_ok=True)

# ---------------- LOAD DATA ----------------
df = pd.read_csv("dataset.csv")

if df.empty:
    raise Exception("dataset.csv is empty")

# ---------------- CLEANING ----------------
df["exercise"] = df["exercise"].str.lower().str.strip()
df["label"] = df["label"].astype(int)

# remove only extreme noise (DO NOT OVER FILTER)
df = df[
    (df["kneeAngle"].between(0, 180)) &
    (df["hipAngle"].between(0, 180)) &
    (df["elbowAngle"].between(0, 180))
]

# =========================================================
# 🔥 FEATURE ENGINEERING (EXERCISE-LEVEL SMART FEATURES)
# =========================================================

df["knee_hip_diff"] = abs(df["kneeAngle"] - df["hipAngle"])
df["hip_elbow_diff"] = abs(df["hipAngle"] - df["elbowAngle"])
df["knee_elbow_diff"] = abs(df["kneeAngle"] - df["elbowAngle"])

df["body_balance"] = (df["kneeAngle"] + df["hipAngle"]) / 2
df["posture_stability"] = (df["kneeAngle"] + df["hipAngle"] + df["elbowAngle"]) / 3

# 🔥 NEW STRONG FEATURES (IMPORTANT IMPROVEMENT)
df["knee_depth"] = 180 - df["kneeAngle"]
df["hip_opening"] = df["hipAngle"] - 90
df["arm_fold_ratio"] = df["elbowAngle"] / 180

# =========================================================
# FEATURES LIST
# =========================================================
FEATURES = [
    "kneeAngle",
    "hipAngle",
    "elbowAngle",
    "legRaiseAngle",

    "knee_hip_diff",
    "hip_elbow_diff",
    "knee_elbow_diff",

    "body_balance",
    "posture_stability",

    "knee_depth",
    "hip_opening",
    "arm_fold_ratio"
]

for col in FEATURES:
    if col not in df.columns:
        df[col] = 0

# =========================================================
# 🔥 TRAIN SEPARATE MODELS PER EXERCISE
# =========================================================
exercises = df["exercise"].unique()

for ex in exercises:

    print(f"\n==============================")
    print(f"🚀 Training: {ex}")
    print(f"==============================")

    data = df[df["exercise"] == ex]

    if len(data) < 15:
        print(f"Skipping {ex} (not enough data)")
        continue

    X = data[FEATURES].fillna(0)
    y = data["label"]

    print("Dataset size:", len(data))
    print("Label distribution:\n", y.value_counts())

    # ---------------- SPLIT ----------------
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.25,
        random_state=42,
        stratify=y
    )

    # ---------------- MODEL ----------------
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=6,
        min_samples_split=5,
        min_samples_leaf=1,
        class_weight="balanced_subsample",
        random_state=42
    )

    # ---------------- TRAIN ----------------
    model.fit(X_train, y_train)

    # ---------------- EVALUATION ----------------
    y_pred = model.predict(X_test)

    print("\n📊 Classification Report:")
    print(classification_report(y_test, y_pred, zero_division=0))

    print("\n📉 Confusion Matrix:")
    print(confusion_matrix(y_test, y_pred))

    accuracy = model.score(X_test, y_test)
    print("\n✅ Accuracy:", accuracy)

    cv_scores = cross_val_score(model, X, y, cv=5)
    print("\n🔁 Cross Validation Mean Accuracy:", cv_scores.mean())

    # ---------------- SAVE MODEL ----------------
    version = datetime.now().strftime("%Y%m%d_%H%M")

    model_path = f"ml_models/{ex}_model_{version}.pkl"
    joblib.dump(model, model_path)

    # ---------------- DB SAVE ----------------
    AIModel.objects.all().update(is_active=False)

    AIModel.objects.create(
        version=version,
        description=f"{ex} posture model (improved features)",
        accuracy=float(accuracy),
        is_active=True
    )

    print(f"\n✅ Saved model for {ex}")

print("\n🚀 ALL MODELS TRAINED SUCCESSFULLY!")