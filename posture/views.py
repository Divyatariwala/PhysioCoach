# posture/views.py

from io import BytesIO
import cv2
import base64
from django.forms import ValidationError
from fastapi.responses import FileResponse
import numpy as np
import json
import os
from django.http import Http404, HttpResponse, JsonResponse, StreamingHttpResponse
from django.shortcuts import get_object_or_404, render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.utils import timezone
import mediapipe as mp
from django.views.decorators.csrf import csrf_protect
from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import User
from datetime import datetime, timedelta
from django.contrib.auth import update_session_auth_hash
from physiocoach import settings
from xhtml2pdf import pisa  # for PDF generation
from django.template.loader import render_to_string

# Import your models
from .models import Profile, Exercise, WorkoutSession, Repetition, Report, Feedback, AIModel

# ---------------------------
# Basic Pages
# ---------------------------

def home(request):
    return render(request, 'posture/home.html')

def about(request):
    return render(request, 'posture/about.html')

def contact(request):
    return render(request, 'posture/contact.html')

@login_required
def profile(request):
    user = request.user
    profile = getattr(user, "profile", None)
    
    reports = Report.objects.filter(user=user).order_by('-generated_at')
    exercises = Exercise.objects.all()

    return render(request, "posture/profile.html", {
        "user": user,
        "profile": profile,
        "reports": reports,
        "exercises": exercises
    })


@login_required
def filter_reports_ajax(request):
    exercise_id = request.GET.get('exercise_id')

    if exercise_id == "all" or not exercise_id:
        reports = Report.objects.all()
    else:
        reports = Report.objects.filter(exercise_id=exercise_id)

    data = {
        "reports": [
            {
                "title": r.exercise.name,
                "date": r.generated_at.strftime("%d %b %Y"),
                "file_url": r.pdf_file.url
            } for r in reports
        ]
    }
    return JsonResponse(data)

@login_required
def download_report(request, report_id):
    try:
        report = Report.objects.get(id=report_id, user=request.user)
        return FileResponse(report.pdf_file.open(), as_attachment=True, filename=report.pdf_file.name)
    except Report.DoesNotExist:
        raise Http404("Report not found")

@login_required
def update_profile_picture(request):
    if request.method == 'POST' and request.FILES.get('profile_picture'):
        profile = request.user.profile
        profile.profile_picture = request.FILES['profile_picture']
        profile.save()
        return JsonResponse({'status': 'success', 'image_url': profile.profile_picture.url})
    return JsonResponse({'status': 'error'}, status=400)

@login_required
def exercises(request):
    exercises = Exercise.objects.all()

    # Prepare data for JS
    exercise_data = [
        {
            "id": e.exercise_id,
            "name": e.name,
            "description": e.description,
            "target_muscle": e.target_muscle,
            "difficulty_level": e.difficulty_level,
            "video_demo_url": e.video_demo_url
        } for e in exercises
    ]

    context = {
        "exercises": exercises,
        "exercise_data_json": json.dumps(exercise_data)  # ✅ must serialize
    }
    return render(request, "posture/exercises.html", context)

def demo(request):
    return render(request, 'posture/demo.html')

# ---------------------------
# LOGIN VIEW
# ---------------------------
@csrf_protect
def login_view(request):
    if request.user.is_authenticated:
        # Redirect logged-in users
        return redirect('home')  # change 'home' to your dashboard or landing page

    if request.method == 'POST':
        username = request.POST.get('username').strip()
        password = request.POST.get('password').strip()

        # Authenticate user
        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)
            messages.success(request, f"Welcome back, {user.username}!")
            return redirect('home')  # redirect after successful login
        else:
            messages.error(request, "Invalid username or password")
            return redirect('login')  # redirect back to login on failure

    return render(request, 'posture/login.html')

# ---------------------------
# REGISTER VIEW
# ---------------------------
@csrf_protect
def register_view(request):
    if request.method == "POST":
        # Get form data
        username = request.POST.get('username', '').strip()
        first_name = request.POST.get('first_name', '').strip()
        last_name = request.POST.get('last_name', '').strip()
        email = request.POST.get('email', '').strip()
        password1 = request.POST.get('password1', '')
        password2 = request.POST.get('password2', '')
        age = request.POST.get('age', '').strip()
        gender = request.POST.get('gender', '').strip()

        # Basic validation
        if password1 != password2:
            messages.error(request, "Passwords do not match")
            return redirect('register')

        if User.objects.filter(username=username).exists():
            messages.error(request, "Username already exists")
            return redirect('register')

        # Create user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password1,
            first_name=first_name,
            last_name=last_name
        )

        # Create or update Profile safely
        profile, created = Profile.objects.get_or_create(
            user=user,
            defaults={'age': age, 'gender': gender}
        )
        if not created:
            profile.age = age
            profile.gender = gender
            profile.save()

        messages.success(request, "Account successfully registered")
        return redirect('login')  # redirect to login after registration

    return render(request, 'posture/register.html')

def forgot_password(request):
    context = {}
    if request.method == "POST":
        old_password = request.POST.get("old_password")
        new_password = request.POST.get("new_password")
        confirm_password = request.POST.get("confirm_password")
        user = request.user

        if not user.check_password(old_password):
            context["old_password_error"] = "Old password is incorrect"
        else:
            user.set_password(new_password)
            user.save()
            update_session_auth_hash(request, user)
            context["success_message"] = "Password changed successfully"

    return render(request, "posture/forgot_password.html", context)

def logout_view(request):
    logout(request)
     # If user logged out from admin panel
    if request.path.startswith('/admin'):
        return redirect('/admin/login/')

    # Otherwise (normal website logout)
    return redirect('exercises')


# ---------------------------
# Workout & Repetitions
# ---------------------------

@login_required
def save_workout_session(request):
    if request.method == "POST":
        data = json.loads(request.body)
        exercise_id = data.get("exercise_id")
        duration_seconds = data.get("duration_seconds", 0)

        exercise = get_object_or_404(Exercise, pk=exercise_id)
        session = WorkoutSession.objects.create(
            user=request.user,
            exercise=exercise,
            start_time=datetime.now() - timedelta(seconds=duration_seconds),
            end_time=datetime.now(),
            duration=timedelta(seconds=duration_seconds),
            device_type="Webcam",
            status="Completed"
        )

        return JsonResponse({"success": True, "session_id": session.session_id})

    return JsonResponse({"success": False})

@login_required
def save_repetitions(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            session_id = data.get("session_id")
            reps = data.get("reps", [])

            # Validate session
            session = get_object_or_404(WorkoutSession, pk=session_id, user=request.user)

            if not reps:
                return JsonResponse({"success": False, "error": "No reps provided"}, status=400)

            for rep in reps:
                count = rep.get("count_number")
                accuracy = rep.get("posture_accuracy")

                if count is None or accuracy is None:
                    continue

                Repetition.objects.create(
                    session=session,
                    count_number=int(count),
                    posture_accuracy=float(accuracy)
                )

            return JsonResponse({"success": True})
        
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=500)
    return JsonResponse({"success": False, "error": "Invalid request"}, status=400)

@login_required
def save_feedback(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            session_id = data.get("session_id")
            feedback_text = data.get("feedback_text")
            accuracy_score = data.get("accuracy_score")

            session = get_object_or_404(WorkoutSession, pk=session_id, user=request.user)

            # Active AI model
            ai_model = AIModel.objects.filter(is_active=True).order_by("-last_updated").first()

            Feedback.objects.create(
                user=request.user,
                session=session,
                feedback_text=feedback_text,
                accuracy_score=accuracy_score,
                ai_model=ai_model
            )

            # --- Generate PDF ---
            repetitions = list(session.repetitions.all())
            total_reps = len(repetitions)
            avg_accuracy = sum([r.posture_accuracy for r in repetitions]) / total_reps if total_reps else 0
            duration = session.duration.total_seconds() if session.duration else 0
            minutes = int(duration // 60)
            seconds = int(duration % 60)

            context = {
                "session": session,
                "repetitions": repetitions,
                "feedbacks": Feedback.objects.filter(session=session),
                "total_reps": total_reps,
                "avg_accuracy": avg_accuracy,
                "minutes": minutes,
                "seconds": seconds,
            }

            html_string = render_to_string("posture/report_template.html", context)
            pdf_file = BytesIO()
            pisa.CreatePDF(html_string, dest=pdf_file)
            pdf_file.seek(0)

            # Save PDF to MEDIA
            reports_dir = os.path.join(settings.MEDIA_ROOT, "reports")
            os.makedirs(reports_dir, exist_ok=True)
            pdf_filename = f"report_session_{session.session_id}.pdf"
            pdf_path = os.path.join(reports_dir, pdf_filename)

            with open(pdf_path, "wb") as f:
                f.write(pdf_file.read())

            # Save Report instance correctly
            report = Report.objects.create(
                user=request.user,
                session=session,
                exercise=session.exercise,  # Required field
                generated_by="AI_Model",
                pdf_file=f"reports/{pdf_filename}"
            )

            return JsonResponse({
                "success": True,
                "report_id": report.report_id,
                "report_url": report.pdf_file.url  # Works with FileField
            })

        except Exception as e:
            print("Error in save_feedback:", e)
            return JsonResponse({"success": False, "error": str(e)}, status=500)

    return JsonResponse({"success": False}, status=400)

# ---------------------------
# Mediapipe Pose Analysis
# ---------------------------

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"  # suppress TensorFlow logs
mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils

@login_required
def analyze_pose(request):
    body = json.loads(request.body)
    frame_data = body['frame'].split(",")[1]
    frame_bytes = base64.b64decode(frame_data)
    np_arr = np.frombuffer(frame_bytes, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    landmarks_list = []

    with mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5) as pose:
        results = pose.process(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
        if results.pose_landmarks:
            lm = results.pose_landmarks.landmark
            landmarks_list = [{"x": l.x, "y": l.y} for l in lm]

    return JsonResponse({
        "landmarks": landmarks_list
    })

