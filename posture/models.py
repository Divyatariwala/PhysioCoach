import uuid
from django.utils import timezone
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
    video_demo_url = models.URLField(blank=True, null=True)

    def __str__(self):
        return self.exercise_name

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

class ChatSession(models.Model):
    chatSession_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)  # set as PK
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_active = models.DateTimeField(auto_now=True)

    def __str__(self):
        return str(self.session_id)

class ChatMessage(models.Model):
    chatMessage_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)  # set as PK
    MESSAGE_TYPE = [('user', 'User'), ('bot', 'Bot')]

    chatSession_id = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages')
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPE)
    message_text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    ai_model = models.ForeignKey(AIModel, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.message_type}: {self.message_text[:30]}"

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
    # therapyplan
    def __str__(self):
        return f"Report for Session {self.session.session_id} - {self.generated_by}"

# =========================
# CONTACTS
# =========================
class Contact(models.Model):
    contact_id = models.UUIDField(primary_key=True,  default=uuid.uuid4, editable=False)  # set as PK
    user = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        help_text="Optional: if submitted by a registered user"
    )
    name = models.CharField(max_length=100, blank=True)
    email = models.EmailField(blank=True)
    message = models.TextField(blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return f"Contact #{self.contact_id} by {self.user.username if self.user else self.name}"
    
class AdminReply(models.Model):
    adminReply_id = models.UUIDField(primary_key=True, editable=False)  # set as PK
    contact = models.ForeignKey(Contact, on_delete=models.CASCADE, related_name="replies")
    admin_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)  # optional
    reply_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

class Notification(models.Model):
    NOTIFICATION_TYPE_CHOICES = [
        ("exercise", "Exercise Reminder"),
        ("inactivity", "Inactivity Reminder"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    subject = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPE_CHOICES)
    is_sent = models.BooleanField(default=False)
    sent_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.notification_type} - {self.sent_at}"