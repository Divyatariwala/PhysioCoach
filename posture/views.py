# posture/views.py

import cv2
import base64
import numpy as np
from django.http import JsonResponse, StreamingHttpResponse
from django.shortcuts import render
import mediapipe as mp
import json
import math
import os
from .models import ExerciseRecord
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib import messages


def home(request):
    return render(request, 'posture/home.html')

def login_view(request):
    if request.method == "POST":
        username = request.POST['username'].strip()
        password = request.POST['password']

        # 1. Empty fields
        if not username or not password:
            messages.error(request, "Both username and password are required")
            return render(request, 'posture/login.html')

        # 2. Authenticate
        user = authenticate(request, username=username, password=password)
        if user is not None:
            # 3. Check active
            if not user.is_active:
                messages.error(request, "This account is inactive. Contact admin.")
                return render(request, 'posture/login.html')

            login(request, user)
            return redirect('exercises')
        else:
            messages.error(request, "Invalid username or password")
            return render(request, 'posture/login.html')

    return render(request, 'posture/login.html')

def register_view(request):
    if request.method == "POST":
        username = request.POST['username'].strip()
        email = request.POST['email'].strip()
        first_name = request.POST.get('first_name', '').strip()
        last_name = request.POST.get('last_name', '').strip()
        password1 = request.POST['password1']
        password2 = request.POST['password2']

        # 1. Check empty fields
        if not username or not email or not password1 or not password2:
            messages.error(request, "All fields are required")
            return render(request, 'posture/register.html')

        # 2. Passwords match
        if password1 != password2:
            messages.error(request, "Passwords do not match")
            return render(request, 'posture/register.html')

        # 3. Password length
        if len(password1) < 8:
            messages.error(request, "Password must be at least 8 characters long")
            return render(request, 'posture/register.html')

        # 4. Password strength
        import re
        if not re.search(r"\d", password1) or not re.search(r"[A-Z]", password1) or not re.search(r"[a-z]", password1):
            messages.error(request, "Password must include uppercase, lowercase and a number")
            return render(request, 'posture/register.html')

        # 5. Unique username
        if User.objects.filter(username=username).exists():
            messages.error(request, "Username already exists")
            return render(request, 'posture/register.html')

        # 6. Unique email
        if User.objects.filter(email=email).exists():
            messages.error(request, "Email already registered")
            return render(request, 'posture/register.html')

        # 7. Valid email format
        from django.core.validators import validate_email
        from django.core.exceptions import ValidationError
        try:
            validate_email(email)
        except ValidationError:
            messages.error(request, "Invalid email format")
            return render(request, 'posture/register.html')

        # Create user if all checks pass
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password1,
            first_name=first_name,
            last_name=last_name
        )
        user.save()
        messages.success(request, "Account created successfully! Please login.")
        return redirect('login')

    return render(request, 'posture/register.html')

def logout_view(request):
    logout(request)
    return redirect('login')

@login_required
def exercises(request):
    return render(request, 'posture/exercises.html')

@login_required
def profile(request):
    records = ExerciseRecord.objects.filter(user=request.user).order_by('-date')
    return render(request, 'posture/profile.html', {'exercise_records': records})

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"  # suppress TensorFlow logs

# Initialize Mediapipe
mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils

# Optional: Server-side video streaming
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


# Analyze pose from base64 image
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
            # Send normalized x, y positions for JS
            landmarks_list = [{"x": l.x, "y": l.y} for l in lm]

    return JsonResponse({
        "landmarks": landmarks_list
    })

@login_required
def save_exercise_record(request):
    if request.method == "POST":
        data = json.loads(request.body)
        exercise_type = data.get("exercise_type")
        reps = data.get("reps", 0)

        if not exercise_type or reps <= 0:
            return JsonResponse({"success": False, "error": "Invalid data"})

        record = ExerciseRecord.objects.create(
            user=request.user,
            exercise_type=exercise_type,
            reps=reps
        )
        return JsonResponse({"success": True, "record_id": record.id})

    return JsonResponse({"success": False, "error": "POST request required"})