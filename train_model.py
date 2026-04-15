import os
import django
import pandas as pd
import joblib
from datetime import datetime

from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix

# ---------------- DJANGO SETUP ----------------
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "theratrack.settings")
django.setup()

from posture.models import AIModel

# ---------------- SETUP ----------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, "ml_models")
os.makedirs(MODEL_DIR, exist_ok=True)

# ---------------- LOAD DATA ----------------
df = pd.read_csv("dataset.csv")

if df.empty:
    raise Exception("dataset.csv is empty")

# ---------------- CLEANING ----------------
df["exercise"] = df["exercise"].str.lower().str.strip()
df["label"] = df["label"].astype(int)

df = df[
    (df["kneeAngle"].between(0, 180)) &
    (df["hipAngle"].between(0, 180)) &
    (df["elbowAngle"].between(0, 180))
]

# =========================================================
# FEATURE ENGINEERING
# =========================================================
df["knee_hip_diff"] = abs(df["kneeAngle"] - df["hipAngle"])
df["hip_elbow_diff"] = abs(df["hipAngle"] - df["elbowAngle"])
df["knee_elbow_diff"] = abs(df["kneeAngle"] - df["elbowAngle"])

df["body_balance"] = (df["kneeAngle"] + df["hipAngle"]) / 2
df["posture_stability"] = (df["kneeAngle"] + df["hipAngle"] + df["elbowAngle"]) / 3

df["knee_depth"] = 180 - df["kneeAngle"]
df["hip_opening"] = df["hipAngle"] - 90
df["arm_fold_ratio"] = df["elbowAngle"] / 180

# =========================================================
# EXERCISE-SPECIFIC FEATURE SETS (IMPORTANT FIX)
# =========================================================
FEATURE_SETS = {
    "squats": [
        "kneeAngle",
        "hipAngle",
        "knee_hip_diff",
        "body_balance",
        "knee_depth"
    ],

    "bicep curls": [
        "elbowAngle",
        "arm_fold_ratio",
        "posture_stability"
    ],

    "side leg raises": [
        "legRaiseAngle",
        "hipAngle",
        "hip_opening",
        "posture_stability"
    ]
}

# =========================================================
# TRAIN MODELS PER EXERCISE
# =========================================================
exercises = df["exercise"].unique()

for ex in exercises:

    print("\n==============================")
    print(f"🚀 Training: {ex}")
    print("==============================")

    data = df[df["exercise"] == ex]

    if len(data) < 20:
        print(f"Skipping {ex} (not enough data)")
        continue

    FEATURES = FEATURE_SETS.get(ex, None)

    if FEATURES is None:
        print(f"No feature set defined for {ex}, skipping")
        continue

    X = data[FEATURES].fillna(0)
    y = data["label"]

    print("Dataset size:", len(data))
    print("Label distribution:\n", y.value_counts())

    # ---------------- MODEL ----------------
    model = RandomForestClassifier(
        n_estimators=300,
        max_depth=8,
        min_samples_split=5,
        min_samples_leaf=2,
        class_weight="balanced",
        random_state=42
    )

    # ---------------- CROSS VALIDATION ----------------
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(model, X, y, cv=cv)

    print("\n🔁 Cross Validation Mean Accuracy:", cv_scores.mean())

    # ---------------- TRAIN FINAL MODEL ----------------
    X_train = X
    y_train = y
    model.fit(X_train, y_train)

    y_pred = model.predict(X_train)

    print("\n📊 Classification Report:")
    print(classification_report(y_train, y_pred, zero_division=0))

    print("\n📉 Confusion Matrix:")
    print(confusion_matrix(y_train, y_pred))

    # ---------------- SAVE MODEL + FEATURES ----------------
    version = datetime.now().strftime("%Y%m%d_%H%M")

    model_bundle = {
        "model": model,
        "features": FEATURES
    }

    model_path = os.path.join(MODEL_DIR, f"{ex}_model_{version}.pkl")
    joblib.dump(model_bundle, model_path)

    # ---------------- DB SAVE ----------------
    AIModel.objects.all().update(is_active=False)

    AIModel.objects.create(
        version=version,
        description=f"{ex} posture model (fixed + optimized)",
        accuracy=float(cv_scores.mean()),
        is_active=True
    )

    print(f"\n✅ Saved model for {ex}")

print("\n🚀 ALL MODELS TRAINED SUCCESSFULLY!")