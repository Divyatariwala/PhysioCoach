from django.db import models
from django.contrib.auth.models import User

# =========================
# PROFILE
# =========================
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    age = models.PositiveIntegerField(null=True, blank=True)
    cookies_accepted = models.BooleanField(default=False)
    
    GENDER_CHOICES = [
        ('Male', 'Male'),
        ('Female', 'Female'),
        ('Other', 'Other'),
    ]
    gender = models.CharField(
        max_length=10, 
        choices=GENDER_CHOICES,
        null=True,
        blank=True
    )

    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    google_flag = models.BooleanField(default=False) 
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} Profile"

# =========================
# EXERCISE & THERAPY PLAN
# =========================
class Exercise(models.Model):
    exercise_id = models.AutoField(primary_key=True)
    exercise_name = models.CharField(max_length=100)
    description = models.TextField()
    target_muscle = models.CharField(max_length=100)
    difficulty_level = models.CharField(
        max_length=50,
        choices=[('Beginner', 'Beginner'), ('Intermediate', 'Intermediate'), ('Advanced', 'Advanced')]
    )
    video_demo_url = models.URLField()

    def __str__(self):
        return self.exercise_name


class TherapyPlan(models.Model):
    plan_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="therapy_plans")
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)
    duration_weeks = models.IntegerField()
    exercises = models.ManyToManyField(Exercise, related_name="therapy_plans")

    def __str__(self):
        return f"Therapy Plan {self.plan_id} for {self.user.username}"

# =========================
# WORKOUT SESSION & REPETITIONS
# =========================
class WorkoutSession(models.Model):
    session_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="workout_sessions")
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE, related_name="workout_sessions")
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    duration = models.DurationField(null=True, blank=True)
    device_type = models.CharField(max_length=50, choices=[('Webcam', 'Webcam'), ('Mobile', 'Mobile')])
    status = models.CharField(max_length=50, choices=[('Active', 'Active'), ('Completed', 'Completed')])

    def __str__(self):
        return f"Session {self.session_id} - {self.user.username}"


class Repetition(models.Model):
    rep_id = models.AutoField(primary_key=True)
    session = models.ForeignKey(WorkoutSession, on_delete=models.CASCADE, related_name="repetitions")
    count_number = models.IntegerField()
    timestamp = models.DateTimeField(auto_now_add=True)
    posture_accuracy = models.FloatField(help_text="Posture accuracy in %")

    def __str__(self):
        return f"Rep {self.count_number} of Session {self.session.session_id}"


# =========================
# AI MODEL & FEEDBACK
# =========================
class AIModel(models.Model):
    model_id = models.AutoField(primary_key=True)
    version = models.CharField(max_length=50)
    description = models.TextField()
    accuracy = models.FloatField()
    last_updated = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=False)

    def __str__(self):
        return f"AI Model v{self.version}"


class Feedback(models.Model):
    feedback_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="feedbacks")
    session = models.ForeignKey(WorkoutSession, on_delete=models.CASCADE, related_name="feedbacks")
    feedback_text = models.TextField()
    accuracy_score = models.FloatField()
    date_time = models.DateTimeField(auto_now_add=True)
    ai_model = models.ForeignKey(AIModel, on_delete=models.SET_NULL, null=True, related_name="feedbacks")

    def __str__(self):
        return f"Feedback {self.feedback_id} for {self.session.user.username}"


# =========================
# REPORTS
# =========================
class Report(models.Model):
    report_id = models.AutoField(primary_key=True)
    session = models.ForeignKey(WorkoutSession, on_delete=models.CASCADE, related_name="reports")
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE, null=True, blank=True)
    generated_by = models.CharField(
        max_length=50,
        choices=[('Admin', 'Admin'), ('AI_Model', 'AI_Model')],
        default='AI_Model'
    )
    pdf_file = models.FileField(upload_to='reports/', null=True, blank=True)
    generated_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Report for Session {self.session.session_id} - {self.generated_by}"
