# posture/management/commands/send_notifications.py

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.template.loader import render_to_string
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.contrib.auth.models import User
from datetime import date

from posture.models import WorkoutSession

# =============================
# CONFIGURATION
# =============================
EXERCISE_REMINDER_HOUR = timezone.localtime().hour  # Set to current hour for testing
INACTIVITY_DAYS = 2  # Number of days of inactivity before sending reminder
LOG_FILE = "notification_log.txt"

class Command(BaseCommand):
    help = "Send TheraTrack email notifications (exercise + inactivity)"

    def handle(self, *args, **kwargs):
        now = timezone.localtime()
        users = User.objects.filter(is_active=True).exclude(is_superuser=True)  # Exclude admins

        for user in users:
            # Exercise Reminder
            if self.exercise_reminder(user, now):
                self.stdout.write(f"Exercise reminder sent to {user.email}")

            # Inactivity Reminder
            if self.inactivity_reminder(user, now):
                self.stdout.write(f"Inactivity reminder sent to {user.email}")

        self.stdout.write(self.style.SUCCESS("TheraTrack notifications process completed."))

    # =============================
    # SEND HTML EMAIL
    # =============================
    def send_html_email(self, user, subject, template_name, context):
        if not user.email:
            return False

        # Render HTML content
        html_content = render_to_string(template_name, context)

        # Create email
        email = EmailMultiAlternatives(
            subject=subject,
            body="This email requires HTML support.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user.email],
        )
        email.attach_alternative(html_content, "text/html")
        email.send(fail_silently=True)

        # Log sent email (UTF-8 to handle emojis)
        with open(LOG_FILE, "a", encoding="utf-8") as log:
            log.write(f"[{timezone.localtime()}] {subject} sent to {user.email}\n")

        return True

    # =============================
    # EXERCISE REMINDER
    # =============================
    def exercise_reminder(self, user, now):
        # Only send if it is the configured reminder hour
        if now.hour != EXERCISE_REMINDER_HOUR:
            return False

        exercised_today = WorkoutSession.objects.filter(
            user=user,
            start_time__date=date.today()
        ).exists()

        if exercised_today:
            return False

        context = {
            "user": user,
            "app_url": settings.APP_URL  # Make sure to define APP_URL in settings
        }

        return self.send_html_email(
            user,
            "⏰ Time for Your TheraTrack Exercise",
            "emails/exercise_reminder.html",
            context
        )

    # =============================
    # INACTIVITY REMINDER
    # =============================
    def inactivity_reminder(self, user, now):
        last_session = WorkoutSession.objects.filter(
            user=user
        ).order_by("-start_time").first()

        if not last_session:
            return False

        inactive_days = (now.date() - last_session.start_time.date()).days

        if inactive_days < INACTIVITY_DAYS:
            return False

        context = {
            "user": user,
            "inactive_days": inactive_days,
            "app_url": settings.APP_URL  # Make sure to define APP_URL in settings
        }

        return self.send_html_email(
            user,
            f"TheraTrack Activity Reminder ({inactive_days} days inactive)",
            "emails/inactivity_reminder.html",
            context
        )
