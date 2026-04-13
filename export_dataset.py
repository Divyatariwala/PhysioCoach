import os
import django
import pandas as pd

# 🔥 SETUP DJANGO ENVIRONMENT
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "theratrack.settings")
django.setup()

from posture.models import TrainingData

rows = []

for obj in TrainingData.objects.all():
    f = obj.features or {}

    rows.append({
        "exercise": obj.exercise,
        "label": obj.label,
        "kneeAngle": f.get("kneeAngle", 0),
        "hipAngle": f.get("hipAngle", 0),
        "elbowAngle": f.get("elbowAngle", 0),
    })

df = pd.DataFrame(rows)
df.to_csv("dataset.csv", index=False)

print("Dataset created ✔")