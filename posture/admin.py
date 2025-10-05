# posture/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from .models import Exercise, TherapyPlan, WorkoutSession, Repetition, Profile

# Inline for Profile
class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False
    verbose_name_plural = 'Profile'

# Extend UserAdmin to include Profile
class UserAdmin(BaseUserAdmin):
    inlines = (ProfileInline,)

# Unregister default User and register our extended version
admin.site.unregister(User)
admin.site.register(User, UserAdmin)

# Optional: Register Profile separately for list view
@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = (
        'get_username',
        'get_first_name',
        'get_last_name',
        'get_email',
        'age',
        'gender',
        'get_profile_picture_path',
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

    # ✅ Show the file path instead of the image
    def get_profile_picture_path(self, obj):
        if obj.profile_picture:
            return obj.profile_picture.name  # Returns "profile_pics/user_1.png"
        return "No picture uploaded"
    get_profile_picture_path.short_description = 'Profile Picture Path'

# Register Exercise so admin can add/edit/delete
@admin.register(Exercise)
class ExerciseAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'target_muscle', 'difficulty_level', 'video_demo_url')
    search_fields = ('name', 'target_muscle')
    list_filter = ('difficulty_level',)