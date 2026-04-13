import joblib
import os
from posture.models import AIModel

MODEL_DIR = "ml_models/"

def load_active_model():
    model_db = AIModel.objects.filter(is_active=True).first()

    if not model_db:
        raise Exception("No active model found")

    model_path = os.path.join(MODEL_DIR, f"posture_v{model_db.version}.pkl")
    scaler_path = os.path.join(MODEL_DIR, f"scaler_v{model_db.version}.pkl")

    model = joblib.load(model_path)
    scaler = joblib.load(scaler_path)

    return model, scaler, model_db