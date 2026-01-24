# posture/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from .models import (
    Profile, Exercise, WorkoutSession, Repetition, Feedback,
    AIModel, ChatSession, ChatMessage, Report,
    Contact, AdminReply, Notification
)

# --------------------------
# Profile Inline in UserAdmin
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
# Profile Admin
# --------------------------
@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('id', 'age', 'gender', 'get_profile_picture_path', 'created_at', 'updated_at')
    list_filter = ('gender',)

    def get_profile_picture_path(self, obj):
        return obj.profile_picture.name if obj.profile_picture else "No picture uploaded"
    get_profile_picture_path.short_description = 'Profile Picture Path'

# --------------------------
# Exercise Admin
# --------------------------
@admin.register(Exercise)
class ExerciseAdmin(admin.ModelAdmin):
    list_display = ('exercise_id', 'exercise_name', 'description', 'target_muscle', 'difficulty_level', 'video_demo_url')
    search_fields = ('exercise_name', 'target_muscle')
    list_filter = ('difficulty_level',)

# --------------------------
# Repetition Inline (Read-only)
# --------------------------
class RepetitionInline(admin.TabularInline):
    model = Repetition
    extra = 0
    readonly_fields = ('count_number', 'posture_accuracy', 'timestamp')
    can_delete = False
    # Prevent adding new repetitions in admin
    def has_add_permission(self, request, obj=None):
        return False

# --------------------------
# Feedback Inline (Read-only)
# --------------------------
class FeedbackInline(admin.TabularInline):
    model = Feedback
    extra = 0
    readonly_fields = ('feedback_text', 'accuracy_score', 'ai_model', 'session', 'date_time')
    can_delete = False
    def has_add_permission(self, request, obj=None):
        return False

# --------------------------
# WorkoutSession Admin (Read-only)
# --------------------------
@admin.register(WorkoutSession)
class WorkoutSessionAdmin(admin.ModelAdmin):
    list_display = ('session_id', 'exercise', 'status', 'device_type', 'start_time', 'end_time', 'duration', 'user_anonymous')
    search_fields = ('exercise__exercise_name',)
    list_filter = ('status', 'device_type')
    inlines = [RepetitionInline, FeedbackInline]

    readonly_fields = ('exercise', 'status', 'device_type', 'start_time', 'end_time', 'duration', 'user')
    def has_add_permission(self, request):
        return False
    def has_delete_permission(self, request, obj=None):
        return False

    def user_anonymous(self, obj):
        return f"User #{obj.user.id}" if obj.user else "Anonymous"
    user_anonymous.short_description = "User"

# --------------------------
# AI Model Admin
# --------------------------
@admin.register(AIModel)
class AIModelAdmin(admin.ModelAdmin):
    list_display = ('version', 'description', 'is_active', 'last_updated')
    list_filter = ('is_active',)
    search_fields = ('version',)

# --------------------------
# ChatMessage Inline (Read-only)
# --------------------------
class ChatMessageInline(admin.TabularInline):
    model = ChatMessage
    extra = 0
    readonly_fields = ('message_type', 'message_text', 'timestamp', 'ai_model')
    can_delete = False
    def has_add_permission(self, request, obj=None):
        return False

# --------------------------
# ChatSession Admin (Read-only)
# --------------------------
@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display = ('chatSession_id', 'created_at', 'last_active', 'message_count', 'user_anonymous')
    inlines = [ChatMessageInline]

    readonly_fields = ('chatSession_id', 'created_at', 'last_active', 'user')
    def has_add_permission(self, request):
        return False
    def has_delete_permission(self, request, obj=None):
        return False

    def message_count(self, obj):
        return obj.messages.count()
    message_count.short_description = "Messages"

    def user_anonymous(self, obj):
        return f"User #{obj.user.id}" if obj.user else "Anonymous"
    user_anonymous.short_description = "User"

# --------------------------
# Report Admin (Read-only)
# --------------------------
@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ('report_id', 'get_session_id', 'exercise', 'generated_by', 'pdf_file', 'generated_at')
    search_fields = ('session__session_id', 'exercise__exercise_name')
    list_filter = ('generated_by', 'generated_at')

    readonly_fields = ('session', 'exercise', 'generated_by', 'pdf_file', 'generated_at')
    def has_add_permission(self, request):
        return False
    def has_delete_permission(self, request, obj=None):
        return False

    def get_session_id(self, obj):
        return f"Session #{obj.session.session_id}"
    get_session_id.short_description = 'Session'

# --------------------------
# Contact Admin (Read-only)
# --------------------------
@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ('contact_id', 'name_or_anonymous', 'email_or_anonymous', 'short_message', 'created_at')
    search_fields = ('name', 'email', 'message')
    list_filter = ('created_at',)

    readonly_fields = ('name', 'email', 'message', 'user', 'created_at')
    def has_add_permission(self, request):
        return False
    def has_delete_permission(self, request, obj=None):
        return False

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

# --------------------------
# AdminReply Admin
# --------------------------
@admin.register(AdminReply)
class AdminReplyAdmin(admin.ModelAdmin):
    list_display = ('display_id', 'contact_info', 'admin_user_anonymous', 'created_at')
    search_fields = ('reply_text',)

    def display_id(self, obj):
        return str(obj.adminReply_id)
    display_id.short_description = "Reply ID"

    def contact_info(self, obj):
        if obj.contact.user:
            return f"User #{obj.contact.user.id}"
        return obj.contact.name or "Anonymous"
    contact_info.short_description = "Contact"

    def admin_user_anonymous(self, obj):
        if obj.admin_user:
            return f"Admin #{obj.admin_user.id}"
        return "Anonymous"
    admin_user_anonymous.short_description = "Admin"

# --------------------------
# Notification Admin (Read-only)
# --------------------------
@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('subject', 'notification_type', 'is_sent', 'sent_at', 'user_anonymous')
    list_filter = ('notification_type', 'is_sent')
    search_fields = ('subject',)

    readonly_fields = ('user', 'subject', 'message', 'notification_type', 'is_sent', 'sent_at')
    def has_add_permission(self, request):
        return False
    def has_delete_permission(self, request, obj=None):
        return False

    def user_anonymous(self, obj):
        return f"User #{obj.user.id}" if obj.user else "Anonymous"
    user_anonymous.short_description = "User"
