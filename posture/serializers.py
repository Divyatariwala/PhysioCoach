from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Profile, Exercise, WorkoutSession, Repetition,
    Feedback, ChatSession, ChatMessage, Report,
    Contact, AIModel, Notification, AdminReply
)

# ------------------------------
# USER & PROFILE SERIALIZERS
# ------------------------------
class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ["age", "gender", "profile_picture", "google_flag", "cookies_accepted"]

class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "email", "profile"]

# ------------------------------
# EXERCISE SERIALIZER
# ------------------------------
class ExerciseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exercise
        fields = "__all__"

# ------------------------------
# WORKOUT & REPETITION SERIALIZERS
# ------------------------------
class WorkoutSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkoutSession
        fields = "__all__"

class RepetitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Repetition
        fields = "__all__"

# ------------------------------
# FEEDBACK
# ------------------------------
class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = "__all__"

# ------------------------------
# AI MODEL
# ------------------------------
class AIModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIModel
        fields = "__all__"

# ------------------------------
# CHAT
# ------------------------------
class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = "__all__"

class ChatSessionSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)

    class Meta:
        model = ChatSession
        fields = ["chatSession_id", "user", "created_at", "last_active", "messages"]

# ------------------------------
# REPORT
# ------------------------------
class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = "__all__"

# ------------------------------
# CONTACT
# ------------------------------
class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = "__all__"

# ------------------------------
# ADMINRPLY
# ------------------------------
class AdminReplySerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminReply
        fields = "__all__"

# ------------------------------
# NOTIFICATION
# ------------------------------
class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = "__all__"