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

# Helper function to calculate angles between 3 points
def calculate_angle(a, b, c):
    ax, ay = a.x, a.y
    bx, by = b.x, b.y
    cx, cy = c.x, c.y

    angle = math.degrees(math.atan2(cy - by, cx - bx) - math.atan2(ay - by, ax - bx))
    angle = abs(angle)
    if angle > 180:
        angle = 360 - angle
    return angle

# Home page
def home(request):
    return render(request, 'posture/home.html')

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

    feedback = ""
    landmarks_list = []
    score = 100
    shoulder_y_diff = 0.0
    hip_y_diff = 0.0

    with mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5) as pose:
        results = pose.process(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))

        if results.pose_landmarks:
            lm = results.pose_landmarks.landmark
            landmarks_list = [{"x": l.x, "y": l.y} for l in lm]

            # --- BACK ANGLE ---
            left_back_angle = calculate_angle(lm[mp_pose.PoseLandmark.LEFT_SHOULDER],
                                              lm[mp_pose.PoseLandmark.LEFT_HIP],
                                              lm[mp_pose.PoseLandmark.LEFT_KNEE])
            right_back_angle = calculate_angle(lm[mp_pose.PoseLandmark.RIGHT_SHOULDER],
                                               lm[mp_pose.PoseLandmark.RIGHT_HIP],
                                               lm[mp_pose.PoseLandmark.RIGHT_KNEE])
            avg_back_angle = (left_back_angle + right_back_angle) / 2

            # Back penalty
            if avg_back_angle < 160:  # Slightly lenient
                score -= (160 - avg_back_angle) * 0.3  # reduce impact

            # --- SHOULDER TILT ---
            shoulder_diff = abs(lm[mp_pose.PoseLandmark.LEFT_SHOULDER].y -
                                lm[mp_pose.PoseLandmark.RIGHT_SHOULDER].y)
            if shoulder_diff > 0.08:  # ignore small tilt
                score -= (shoulder_diff - 0.08) * 200

            # --- HIP SIDE LEAN ---
            hip_diff = abs(lm[mp_pose.PoseLandmark.LEFT_HIP].x -
                           lm[mp_pose.PoseLandmark.RIGHT_HIP].x)
            if hip_diff > 0.08:  # ignore small lean
                score -= (hip_diff - 0.08) * 200

            # Clamp
            score = max(0, min(100, score))

            # STRAIGHT POSTURE CHECK
            straight_posture = (
                avg_back_angle > 165 and         # was 170
                shoulder_diff < 0.06 and         # was 0.04
                hip_diff < 0.06                  # was 0.04
            )

            # Feedback
            if straight_posture:
                feedback = "Perfect! Your posture is straight."
            elif score > 90:
                feedback = "Excellent posture!"
            elif score > 75:
                feedback = "Good posture"
            elif score > 50:
                feedback = "Back bent / lean detected!"
            else:
                feedback = "Posture needs correction!"

            # Calculate alignment
            LEFT_SHOULDER = mp_pose.PoseLandmark.LEFT_SHOULDER.value
            RIGHT_SHOULDER = mp_pose.PoseLandmark.RIGHT_SHOULDER.value
            LEFT_HIP = mp_pose.PoseLandmark.LEFT_HIP.value
            RIGHT_HIP = mp_pose.PoseLandmark.RIGHT_HIP.value

            ls = lm[LEFT_SHOULDER]
            rs = lm[RIGHT_SHOULDER]
            lh = lm[LEFT_HIP]
            rh = lm[RIGHT_HIP]

            shoulder_y_diff = abs(ls.y - rs.y)
            hip_y_diff = abs(lh.y - rh.y)

            # Color feedback logic (for reference, not used in backend)
            is_straight = (shoulder_y_diff < 0.03 and hip_y_diff < 0.03)

            # Use this for feedback
            if is_straight:
                feedback = "Perfect! Your posture is straight."
            else:
                feedback = "Please straighten your shoulders and hips."

    return JsonResponse({
        "feedback": feedback,
        "landmarks": landmarks_list,
        "shoulder_y_diff": shoulder_y_diff,
        "hip_y_diff": hip_y_diff
    })
