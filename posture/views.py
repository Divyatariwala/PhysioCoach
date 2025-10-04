# posture/views.py

import cv2
import base64
from django.forms import ValidationError
import numpy as np
import json
import os
from django.http import JsonResponse, StreamingHttpResponse
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.utils import timezone
import mediapipe as mp
from django.views.decorators.csrf import csrf_protect
from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import User

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
    return render(request, 'posture/profile.html')

@login_required
def exercises(request):
    all_exercises = Exercise.objects.all()
    return render(request, 'posture/exercises.html', {"exercises": all_exercises})


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


def logout_view(request):
    logout(request)
    return redirect('home')


# ---------------------------
# Workout & Repetitions
# ---------------------------

@login_required
def start_workout(request, exercise_id):
    """Start a workout session for a given exercise"""
    exercise = Exercise.objects.get(pk=exercise_id)
    session = WorkoutSession.objects.create(
        user=request.user,
        exercise=exercise,
        start_time=timezone.now(),
        status="Active",
        device_type="Webcam"
    )
    return JsonResponse({"session_id": session.session_id, "message": "Workout started"})


@login_required
def save_repetitions(request, session_id):
    """Save a repetition for a session"""
    if request.method == "POST":
        data = json.loads(request.body)
        session = WorkoutSession.objects.get(pk=session_id)

        rep = Repetition.objects.create(
            session=session,
            count_number=data.get("count_number"),
            angle_left=data.get("angle_left"),
            angle_right=data.get("angle_right"),
            posture_accuracy=data.get("posture_accuracy")
        )

        return JsonResponse({
            "rep_id": rep.rep_id,
            "message": f"Repetition {rep.count_number} saved"
        })


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
