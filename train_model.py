import os
import django
import pandas as pd
import joblib
from datetime import datetime

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler

# ---------------- DJANGO SETUP ----------------
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "theratrack.settings")
django.setup()

from posture.models import AIModel  # import AFTER setup

# ---------------- CREATE FOLDERS SAFELY ----------------
os.makedirs("ml_models", exist_ok=True)

# ---------------- LOAD DATA ----------------
df = pd.read_csv("dataset.csv")

# ---------------- VALIDATION (IMPORTANT) ----------------
if df.empty:
    raise Exception("dataset.csv is empty. Add training data first.")

required_cols = ["kneeAngle", "hipAngle", "elbowAngle", "label"]
for col in required_cols:
    if col not in df.columns:
        raise Exception(f"Missing column: {col}")

# ---------------- FEATURES / LABEL ----------------
X = df[["kneeAngle", "hipAngle", "elbowAngle"]].fillna(0)
y = df["label"].astype(int)

# ---------------- SCALE ----------------
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# ---------------- SPLIT ----------------
X_train, X_test, y_train, y_test = train_test_split(
    X_scaled,
    y,
    test_size=0.2,
    random_state=42
)

# ---------------- TRAIN MODEL ----------------
model = RandomForestClassifier(
    n_estimators=150,
    max_depth=10,
    random_state=42
)

model.fit(X_train, y_train)

accuracy = model.score(X_test, y_test)
print("Accuracy:", accuracy)

# ---------------- SAVE MODEL ----------------
version = datetime.now().strftime("%Y%m%d_%H%M")

model_path = f"ml_models/posture_v{version}.pkl"
scaler_path = f"ml_models/scaler_v{version}.pkl"

joblib.dump(model, model_path)
joblib.dump(scaler, scaler_path)

# ---------------- DB SAVE ----------------

# deactivate old models FIRST (safer)
AIModel.objects.all().update(is_active=False)

AIModel.objects.create(
    version=version,
    description="Posture detection model",
    accuracy=accuracy,
    is_active=True
)

print("Model saved ✔")
print("Version:", version)