# posture/models.py
from django.db import models
from django.contrib.auth.models import User

class ExerciseRecord(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    exercise_type = models.CharField(max_length=50)
    reps = models.IntegerField(default=0)
    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.exercise_type} - {self.reps}"
