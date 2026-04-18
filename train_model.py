import os
import django
import pandas as pd
import joblib
from datetime import datetime

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix

# ---------------- DJANGO SETUP ----------------
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "theratrack.settings")
django.setup()

from posture.models import AIModel

# ---------------- PATH SETUP ----------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(os.path.dirname(__file__), "dataset.csv")
MODEL_DIR = os.path.join(BASE_DIR, "ml_models")
os.makedirs(MODEL_DIR, exist_ok=True)

# ---------------- LOAD DATA ----------------
df = pd.read_csv(DATA_PATH)

if df.empty:
    raise ValueError("dataset.csv is empty")

# ---------------- CLEANING ----------------
df["exercise"] = df["exercise"].str.lower().str.strip()
df["label"] = df["label"].astype(int)

df = df[
    (df["kneeAngle"].between(0, 180)) &
    (df["hipAngle"].between(0, 180)) &
    (df["elbowAngle"].between(0, 180))
]

# ---------------- FEATURE ENGINEERING ----------------
df["knee_hip_diff"] = abs(df["kneeAngle"] - df["hipAngle"])
df["hip_elbow_diff"] = abs(df["hipAngle"] - df["elbowAngle"])
df["knee_elbow_diff"] = abs(df["kneeAngle"] - df["elbowAngle"])

df["body_balance"] = (df["kneeAngle"] + df["hipAngle"]) / 2
df["posture_stability"] = (df["kneeAngle"] + df["hipAngle"] + df["elbowAngle"]) / 3

df["knee_depth"] = 180 - df["kneeAngle"]
df["hip_opening"] = df["hipAngle"] - 90
df["arm_fold_ratio"] = df["elbowAngle"] / 180

# ---------------- FEATURE MAP ----------------
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

# ---------------- TRAINING LOOP ----------------
for exercise_name in df["exercise"].unique():

    print("\n==============================")
    print(f"🚀 Training Model: {exercise_name}")
    print("==============================")

    data = df[df["exercise"] == exercise_name]

    if len(data) < 20:
        print(f"Skipping {exercise_name} (not enough data)")
        continue

    FEATURES = FEATURE_SETS.get(exercise_name, [])
    FEATURES = [f for f in FEATURES if f in data.columns]

    if not FEATURES:
        print(f"No valid features for {exercise_name}")
        continue

    X = data[FEATURES].fillna(0)
    y = data["label"]

    print("Dataset size:", len(data))
    print("Label distribution:\n", y.value_counts())

    # ---------------- MODEL ----------------
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=5,
        min_samples_split=4,
        min_samples_leaf=3,
        class_weight="balanced",
        random_state=42
    )

    # ---------------- CROSS VALIDATION ----------------
    cv = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)
    cv_scores = cross_val_score(model, X, y, cv=cv)

    print("\n🔁 Cross Validation Mean Accuracy:", cv_scores.mean())

    # ---------------- TRAIN / TEST SPLIT (IMPORTANT FIX) ----------------
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y
    )

    # ---------------- TRAIN MODEL ----------------
    model.fit(X_train, y_train)

    # ---------------- EVALUATION (REAL) ----------------
    y_pred = model.predict(X_test)

    print("\n📊 Classification Report (TEST DATA):")
    print(classification_report(y_test, y_pred, zero_division=0))

    print("\n📉 Confusion Matrix (TEST DATA):")
    print(confusion_matrix(y_test, y_pred))

    # ---------------- SAVE MODEL ----------------
    version = datetime.now().strftime("%Y%m%d_%H%M")

    model_bundle = {
        "model": model,
        "features": FEATURES
    }

    model_path = os.path.join(MODEL_DIR, f"{exercise_name}_model_{version}.pkl")
    joblib.dump(model_bundle, model_path)

    # ---------------- SAVE TO DATABASE ----------------
    AIModel.objects.filter(exercise=exercise_name).update(is_active=False)

    AIModel.objects.create(
        exercise=exercise_name,
        version=version,
        description=f"{exercise_name} posture classification model (train/test fixed)",
        accuracy=float(cv_scores.mean()),
        is_active=True
    )

    print(f"\n✅ Model saved for {exercise_name}")

print("\n🚀 ALL MODELS TRAINED SUCCESSFULLY!")