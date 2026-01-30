from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from django.utils.html import format_html

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
    readonly_fields = ('age','gender','profile_picture','created_at','updated_at')

    def has_add_permission(self, request, obj=None):
        return False


class UserAdmin(BaseUserAdmin):
    inlines = (ProfileInline,)
    list_display = ('id', 'is_staff', 'is_superuser', 'date_joined', 'last_login')
    list_filter = ('is_active', 'is_staff', 'is_superuser')


admin.site.unregister(User)
admin.site.register(User, UserAdmin)


# --------------------------
# Profile (VIEW ONLY)
# --------------------------
@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('id', 'age', 'gender', 'get_profile_picture_path', 'created_at', 'updated_at')
    list_filter = ('gender',)
    readonly_fields = ('age','gender','profile_picture','created_at','updated_at')

    def get_profile_picture_path(self, obj):
        return obj.profile_picture.name if obj.profile_picture else "No picture uploaded"
    get_profile_picture_path.short_description = 'Profile Picture Path'

    def has_add_permission(self, request):
        return False
    def has_change_permission(self, request, obj=None):
        return False
    def has_delete_permission(self, request, obj=None):
        return False


# --------------------------
# Exercise (EDIT & DELETE allowed, NO ADD)
# --------------------------
@admin.register(Exercise)
class ExerciseAdmin(admin.ModelAdmin):
    list_display = ('exercise_id', 'exercise_name', 'description', 'target_muscle', 'difficulty_level', 'video_demo_url')
    search_fields = ('exercise_name', 'target_muscle')
    list_filter = ('difficulty_level',)

    def has_add_permission(self, request):
        return False


# --------------------------
# Repetition Inline (VIEW ONLY)
# --------------------------
class RepetitionInline(admin.TabularInline):
    model = Repetition
    extra = 0
    readonly_fields = ('count_number', 'posture_accuracy_display', 'timestamp')
    can_delete = False

    def posture_accuracy_display(self, obj):
        return f"{obj.posture_accuracy:.0f} %"
    posture_accuracy_display.short_description = "Accuracy"

    def has_add_permission(self, request, obj=None):
        return False


# --------------------------
# Feedback Inline (VIEW ONLY)
# --------------------------
class FeedbackInline(admin.TabularInline):
    model = Feedback
    extra = 0
    readonly_fields = ('feedback_text_display', 'accuracy_score_display', 'ai_model', 'date_time')
    can_delete = False

    def feedback_text_display(self, obj):
        return format_html("<div style='max-width:400px; white-space:pre-wrap;'>{}</div>", obj.feedback_text)
    feedback_text_display.short_description = "Feedback"

    def accuracy_score_display(self, obj):
        return f"{obj.accuracy_score:.0f} %"
    accuracy_score_display.short_description = "Score"

    def has_add_permission(self, request, obj=None):
        return False


# --------------------------
# WorkoutSession (VIEW ONLY)
# --------------------------
@admin.register(WorkoutSession)
class WorkoutSessionAdmin(admin.ModelAdmin):
    list_display = ('session_id', 'exercise', 'status', 'device_type', 'start_time', 'end_time', 'duration', 'user_anonymous')
    search_fields = ('exercise__exercise_name', 'user__username')
    list_filter = ('status', 'device_type')
    inlines = [RepetitionInline, FeedbackInline]

    readonly_fields = ('exercise', 'status', 'device_type', 'start_time', 'end_time', 'duration', 'user')

    def has_add_permission(self, request):
        return False
    def has_change_permission(self, request, obj=None):
        return False
    def has_delete_permission(self, request, obj=None):
        return False

    def user_anonymous(self, obj):
        return f"User #{obj.user.id}" if obj.user else "Anonymous"
    user_anonymous.short_description = "User"


# --------------------------
# AIModel (EDIT & DELETE allowed, NO ADD)
# --------------------------
@admin.register(AIModel)
class AIModelAdmin(admin.ModelAdmin):
    list_display = ('version', 'description', 'is_active', 'last_updated')
    list_filter = ('is_active',)
    search_fields = ('version',)

    def has_add_permission(self, request):
        return False


# --------------------------
# ChatMessage Inline (VIEW ONLY)
# --------------------------
class ChatMessageInline(admin.TabularInline):
    model = ChatMessage
    extra = 0
    readonly_fields = ('message_type', 'message_text', 'timestamp', 'ai_model')
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


# --------------------------
# ChatSession (VIEW ONLY)
# --------------------------
@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display = ('chatSession_id', 'created_at', 'last_active', 'message_count', 'user_anonymous')
    inlines = [ChatMessageInline]
    readonly_fields = ('chatSession_id', 'created_at', 'last_active', 'user')

    def has_add_permission(self, request):
        return False
    def has_change_permission(self, request, obj=None):
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
# Report (VIEW + EDIT, NO ADD, NO DELETE)
# --------------------------
@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ('report_id', 'get_session_id', 'exercise', 'generated_by', 'pdf_file', 'generated_at')
    readonly_fields = ('session', 'exercise', 'generated_by', 'pdf_file', 'generated_at')

    def has_add_permission(self, request):
        return False
    def has_delete_permission(self, request, obj=None):
        return False

    def get_session_id(self, obj):
        return f"Session #{obj.session.session_id}"
    get_session_id.short_description = 'Session'


# --------------------------
# Contact (VIEW ONLY)
# --------------------------
@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ('contact_id', 'name_or_anonymous', 'email_or_anonymous', 'short_message', 'created_at')
    readonly_fields = ('name', 'email', 'message', 'user', 'created_at')

    def has_add_permission(self, request):
        return False
    def has_change_permission(self, request, obj=None):
        return False
    def has_delete_permission(self, request, obj=None):
        return False

    def name_or_anonymous(self, obj):
        return obj.name or "Anonymous"
    name_or_anonymous.short_description = "Name"

    def email_or_anonymous(self, obj):
        return obj.email or "Anonymous"
    email_or_anonymous.short_description = "Email"

    def short_message(self, obj):
        if obj.message and len(obj.message) > 50:
            return obj.message[:50] + "..."
        return obj.message or "-"
    short_message.short_description = "Message"


# --------------------------
# AdminReply (EDIT & DELETE allowed, NO ADD)
# --------------------------
@admin.register(AdminReply)
class AdminReplyAdmin(admin.ModelAdmin):
    list_display = ('display_id', 'contact_info', 'admin_user_anonymous', 'created_at')

    def has_add_permission(self, request):
        return False

    def display_id(self, obj):
        return str(obj.adminReply_id)
    display_id.short_description = "Reply ID"

    def contact_info(self, obj):
        return f"User #{obj.contact.user.id}" if obj.contact.user else obj.contact.name or "Anonymous"
    contact_info.short_description = "Contact"

    def admin_user_anonymous(self, obj):
        return f"Admin #{obj.admin_user.id}" if obj.admin_user else "Anonymous"
    admin_user_anonymous.short_description = "Admin"


# --------------------------
# Notification (VIEW ONLY)
# --------------------------
@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('subject', 'notification_type', 'is_sent', 'sent_at', 'user_anonymous')
    readonly_fields = ('user', 'subject', 'message', 'notification_type', 'is_sent', 'sent_at')

    def has_add_permission(self, request):
        return False
    def has_change_permission(self, request, obj=None):
        return False
    def has_delete_permission(self, request, obj=None):
        return False

    def user_anonymous(self, obj):
        return f"User #{obj.user.id}" if obj.user else "Anonymous"
    user_anonymous.short_description = "User"
