# posture/views.py

import cv2
import base64
from django.forms import ValidationError
import numpy as np
import json
import os
from django.http import JsonResponse, StreamingHttpResponse
from django.shortcuts import get_object_or_404, render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.utils import timezone
import mediapipe as mp
from django.views.decorators.csrf import csrf_protect
from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import User
from datetime import datetime
from django.contrib.auth import update_session_auth_hash

from physiocoach import settings

# Import your models
from .models import Profile, Exercise, WorkoutSession, Repetition, Report, Feedback

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
    reports = Report.objects.filter(user=user).order_by('-report_date')
    profile = getattr(user, "profile", None)
    return render(request, "posture/profile.html", {
        "user": user,
        "profile": profile,
        "reports": reports
    })

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
            return redirect('exercises')  # redirect after successful login
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
        try:
            data = json.loads(request.body.decode("utf-8"))
            user = request.user  # logged-in user

            exercise_id = data.get("exercise_id")
            session_id = data.get("session_id")

            # Start session
            if exercise_id and not session_id:
                exercise = Exercise.objects.get(exercise_id=exercise_id)
                session = WorkoutSession.objects.create(
                    user=user,
                    exercise=exercise,
                    start_time=datetime.fromisoformat(data["start_time"].replace("Z", "+00:00")),
                    device_type=data.get("device_type", "Webcam"),
                    status="Active",
                )
                return JsonResponse({"session_id": session.session_id})

            # End session
            elif session_id:
                session = WorkoutSession.objects.get(session_id=session_id)
                end_time = datetime.fromisoformat(data["end_time"].replace("Z", "+00:00"))
                session.end_time = end_time
                session.duration = datetime.fromtimestamp(
                    (end_time - session.start_time).total_seconds()
                )
                session.status = data.get("status", "Completed")
                session.save()
                return JsonResponse({"message": "Session updated successfully"})

            return JsonResponse({"error": "Invalid data"}, status=400)

        except Exception as e:
            print("🔥 Error in save_workout_session:", str(e))
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=405)

@login_required
def save_repetitions(request, session_id):
    """AJAX: Save reps after a workout session"""
    if request.method == "POST":
        data = json.loads(request.body)
        session = get_object_or_404(WorkoutSession, pk=session_id)
        reps = data.get("reps", [])

        for r in reps:
            Repetition.objects.create(
                session=session,
                count_number=r.get("count_number"),
                posture_accuracy=r.get("posture_accuracy")
            )

        # Mark session as completed
        session.end_time = timezone.now()
        session.duration = (session.end_time - session.start_time).total_seconds()
        session.status = "Completed"
        session.save()

        return JsonResponse({"message": f"{len(reps)} reps saved, session completed"})

@login_required
def save_feedback(request, session_id):
    """
    Save real-time AI feedback for a workout session.
    """
    if request.method == "POST":
        data = json.loads(request.body)
        session = WorkoutSession.objects.get(pk=session_id)

        feedback = Feedback.objects.create(
            user=request.user,
            session=session,
            feedback_text=data.get("message"),
            accuracy_score=data.get("accuracy_score", None),
            dt_time=timezone.now()
        )
        return JsonResponse({"message": "Feedback saved", "feedback_id": feedback.feedback_id})




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

