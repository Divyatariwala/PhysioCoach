# posture/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from .models import (
    ChatMessage, ChatSession, Contact, Profile, Exercise, TherapyPlan, WorkoutSession,
    Repetition, Report, AIModel, Feedback
)

# --------------------------
# Profile inline in UserAdmin
# --------------------------
class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False
    verbose_name_plural = 'Profile'

class UserAdmin(BaseUserAdmin):
    inlines = (ProfileInline,)
    list_display = ('id', 'is_staff', 'is_superuser', 'date_joined', 'last_login')
    list_filter = ('is_active', 'is_staff', 'is_superuser')

admin.site.unregister(User)
admin.site.register(User, UserAdmin)


# --------------------------
# Profile Admin (fully anonymous)
# --------------------------
@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('id', 'age', 'gender', 'get_profile_picture_path', 'created_at', 'updated_at')
    list_filter = ('gender',)

    def get_profile_picture_path(self, obj):
        return obj.profile_picture.name if obj.profile_picture else "No picture uploaded"
    get_profile_picture_path.short_description = 'Profile Picture Path'


# --------------------------
# Exercise Admin (no change needed)
# --------------------------
@admin.register(Exercise)
class ExerciseAdmin(admin.ModelAdmin):
    list_display = ('exercise_id', 'exercise_name', 'description', 'target_muscle', 'difficulty_level', 'video_demo_url')
    search_fields = ('exercise_name', 'target_muscle')
    list_filter = ('difficulty_level',)

# --------------------------
# Report Admin (anonymous user)
# --------------------------
@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ('report_id', 'get_session_id', 'exercise', 'generated_by', 'pdf_file', 'generated_at')
    search_fields = ('session__session_id', 'exercise__exercise_name')
    list_filter = ('generated_by', 'generated_at')

    # Hide actual user
    def get_session_id(self, obj):
        return f"Session #{obj.session.session_id}"
    get_session_id.short_description = 'Session'


# --------------------------
# Repetition Inline (anonymous)
# --------------------------
class RepetitionInline(admin.TabularInline):
    model = Repetition
    extra = 0
    readonly_fields = ('count_number', 'posture_accuracy', 'timestamp')


# --------------------------
# Feedback Inline (anonymous)
# --------------------------
class FeedbackInline(admin.TabularInline):
    model = Feedback
    extra = 0
    readonly_fields = ('feedback_text', 'accuracy_score', 'ai_model', 'session', 'date_time')


# --------------------------
# WorkoutSession Admin (fully anonymous)
# --------------------------
@admin.register(WorkoutSession)
class WorkoutSessionAdmin(admin.ModelAdmin):
    list_display = ('session_id', 'exercise', 'start_time', 'end_time', 'duration', 'status', 'device_type')
    search_fields = ('exercise__exercise_name', 'session_id')
    list_filter = ('status', 'device_type')
    inlines = [RepetitionInline, FeedbackInline]


@admin.register(AIModel)
class AIModelAdmin(admin.ModelAdmin):
    list_display = ('version', 'description', 'is_active', 'last_updated')
    list_filter = ('is_active',)
    search_fields = ('version',)

class ChatMessageInline(admin.TabularInline):
    model = ChatMessage
    extra = 0
    readonly_fields = ('message_type', 'message_text', 'timestamp', 'ai_model')

@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display = ('session_id', 'created_at', 'last_active', 'message_count')
    inlines = [ChatMessageInline]

    def message_count(self, obj):
        return obj.messages.count()
    
# --------------------------
# Contact Admin (anonymous)
# --------------------------
@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ('id', 'name_or_anonymous', 'email_or_anonymous', 'short_message', 'created_at')
    search_fields = ('name', 'email', 'message')
    list_filter = ('created_at',)

    # Show "Anonymous" if name/email is missing
    def name_or_anonymous(self, obj):
        return obj.name if obj.name else "Anonymous"
    name_or_anonymous.short_description = "Name"

    def email_or_anonymous(self, obj):
        return obj.email if obj.email else "Anonymous"
    email_or_anonymous.short_description = "Email"

    def short_message(self, obj):
        if obj.message and len(obj.message) > 50:
            return obj.message[:50] + "..."
        return obj.message or "-"
    short_message.short_description = "Message"