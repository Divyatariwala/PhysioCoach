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
    if request.method == "POST" and request.FILES.get('profile_picture'):
        uploaded_file = request.FILES['profile_picture']
        # Save the file in static folder
        file_name = f"user_{request.user.id}.png"
        save_path = os.path.join(settings.BASE_DIR, 'static', 'posture', 'images', file_name)

        with open(save_path, 'wb+') as f:
            for chunk in uploaded_file.chunks():
                f.write(chunk)

        # Update profile to point to uploaded file
        profile.profile_picture = f"posture/images/{file_name}"
        profile.save()
        return redirect('profile')

    return render(request, "posture/profile.html", {"user": user, "profile": profile, "reports": reports})

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
        username = request.POST['username'].strip()
        first_name = request.POST['first_name'].strip()
        last_name = request.POST['last_name'].strip()
        email = request.POST['email'].strip()
        password1 = request.POST['password1']
        password2 = request.POST['password2']
        age = request.POST['age']
        gender = request.POST['gender']

        if password1 != password2:
            messages.error(request, "Passwords do not match")
            return redirect('register')

        if User.objects.filter(username=username).exists():
            messages.error(request, "Username already exists")
            return redirect('register')

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password1,
            first_name=first_name,
            last_name=last_name
        )
        # Profile is automatically created via signal
        profile = user.profile
        profile.age = age
        profile.gender = gender
        profile.save()

        messages.success(request, "Account successfully registered")
        return redirect('register')

    return render(request, 'posture/register.html')

@login_required
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
    return redirect('home')


# ---------------------------
# Workout & Repetitions
# ---------------------------

@login_required
def save_workout_session(request):
    if request.method != "POST":
        return JsonResponse({"error": "Invalid request"}, status=400)

    try:
        data = json.loads(request.body)

        # ---- STOP WORKOUT ----
        if "session_id" in data:
            session_id = data.get("session_id")
            session = WorkoutSession.objects.get(id=session_id)

            if "end_time" in data:
                session.end_time = datetime.fromisoformat(data["end_time"])
            if "duration" in data:
                session.duration = data["duration"]
            if "status" in data:
                session.status = data["status"]

            session.save()
            return JsonResponse({"status": "Workout session updated successfully"})

        # ---- START WORKOUT ----
        else:
            exercise_id = data.get("exercise_id")
            if not exercise_id:
                return JsonResponse({"error": "exercise_id is required"}, status=400)

            try:
                exercise = Exercise.objects.get(id=exercise_id)
            except Exercise.DoesNotExist:
                return JsonResponse({"error": f"Exercise with id {exercise_id} not found"}, status=404)

            start_time_str = data.get("start_time")
            if not start_time_str:
                return JsonResponse({"error": "start_time is required"}, status=400)

            start_time = datetime.fromisoformat(start_time_str)
            device_type = data.get("device_type", "webcam")

            session = WorkoutSession.objects.create(
                exercise=exercise,
                start_time=start_time,
                device_type=device_type,
                status="In Progress"
            )

            return JsonResponse({"session_id": session.id})

    except Exception as e:
        print("Error in save_workout_session:", e)
        return JsonResponse({"error": str(e)}, status=500)

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

def gen_frames():
    cap = cv2.VideoCapture(0)
    with mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5) as pose:
        while True:
            success, frame = cap.read()
            if not success:
                break

            frame = cv2.flip(frame, 1)
            image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = pose.process(image_rgb)

            if results.pose_landmarks:
                mp_drawing.draw_landmarks(frame, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)

            ret, buffer = cv2.imencode('.jpg', frame)
            frame_bytes = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

def video_feed(request):
    return StreamingHttpResponse(gen_frames(), content_type='multipart/x-mixed-replace; boundary=frame')


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

