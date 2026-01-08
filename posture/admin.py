# posture/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from .models import (
    Profile, Exercise, TherapyPlan, WorkoutSession,
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
    list_display = (
        'id', 'username', 'first_name', 'last_name', 'email', 'is_staff', 'is_superuser', 'date_joined', 'last_login'
    )
    list_filter = ('is_active', 'is_staff', 'is_superuser')


admin.site.unregister(User)
admin.site.register(User, UserAdmin)


# --------------------------
# Profile Admin
# --------------------------
@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'get_username', 'get_first_name', 'get_last_name', 'get_email',
        'age', 'gender', 'get_profile_picture_path', 'created_at', 'updated_at'
    )
    search_fields = ('user__username', 'user__first_name', 'user__last_name', 'user__email')
    list_filter = ('gender',)

    def get_username(self, obj):
        return obj.user.username
    get_username.short_description = 'Username'

    def get_first_name(self, obj):
        return obj.user.first_name
    get_first_name.short_description = 'First Name'

    def get_last_name(self, obj):
        return obj.user.last_name
    get_last_name.short_description = 'Last Name'

    def get_email(self, obj):
        return obj.user.email
    get_email.short_description = 'Email'

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
# AI Model Admin
# --------------------------
@admin.register(AIModel)
class AIModelAdmin(admin.ModelAdmin):
    list_display = ('model_id', 'version', 'description', 'accuracy', 'is_active', 'last_updated')
    search_fields = ('version',)
    list_filter = ('is_active',)


# --------------------------
# Report Admin
# --------------------------
@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ('report_id', 'session', 'exercise', 'generated_by', 'pdf_file', 'generated_at')
    search_fields = ('session__session_id', 'exercise__exercise_name')
    list_filter = ('generated_by', 'generated_at')


# --------------------------
# Repetition Inline
# --------------------------
class RepetitionInline(admin.TabularInline):
    model = Repetition
    extra = 0
    readonly_fields = ('rep_id', 'count_number', 'posture_accuracy', 'timestamp')


# --------------------------
# Feedback Inline
# --------------------------
class FeedbackInline(admin.TabularInline):
    model = Feedback
    extra = 0
    readonly_fields = ('feedback_id', 'feedback_text', 'accuracy_score', 'ai_model', 'session', 'date_time')


# --------------------------
# WorkoutSession Admin
# --------------------------
@admin.register(WorkoutSession)
class WorkoutSessionAdmin(admin.ModelAdmin):
    list_display = ('session_id', 'user', 'exercise', 'start_time', 'end_time', 'duration', 'status', 'device_type')
    search_fields = ('user__username', 'exercise__exercise_name', 'session_id')
    list_filter = ('status', 'device_type')
    inlines = [RepetitionInline, FeedbackInline]
