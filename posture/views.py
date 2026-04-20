# posture/views.py

from io import BytesIO
from random import randint
from datetime import datetime, timedelta
import traceback
import cv2
import base64
import numpy as np
import json
import os
import re
import traceback
import pandas as pd
import joblib
import glob

from django.utils import timezone
from django.core.mail import send_mail
from django.core.files.base import ContentFile
from django.contrib.auth import get_backends, authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from django.http import Http404, HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from posture.utils.model_loader import load_active_model

from .ai import generate_response
from .models import (
    ChatMessage, ChatSession, Contact, Profile, Exercise, TrainingData,
    WorkoutSession, Repetition, Report, Feedback, AIModel
)
from theratrack import settings

# ---------------------------
# JWT Utility
# ---------------------------
def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {"refresh": str(refresh), "access": str(refresh.access_token)}

@api_view(['GET'])
def current_user(request):
    if request.user.is_authenticated:
        return JsonResponse({"username": request.user.username, "email": request.user.email})
    return JsonResponse({"error": "Unauthorized"}, status=401)

# ---------------------------
# PROFILE
# ---------------------------
class ProfileAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        profile = getattr(user, "profile", None)

        profile_data = {
            "first_name": user.first_name,
            "last_name": user.last_name,
            "username": user.username,
            "email": user.email,
            "age": profile.age if profile else None,
            "gender": profile.gender if profile else None,
            "profile_picture": profile.profile_picture.url if profile and profile.profile_picture else "/static/posture/images/default-avatar.png",
            "is_google": profile.google_flag if profile else False
        }

        reports = Report.objects.filter(session__user=user).order_by("-generated_at")
        reports_data = []
        for report in reports:
            reports_data.append({
                "id": report.report_id,
                "title": f"Report for Session {report.session.session_id}",
                "exercise": {"id": report.exercise.exercise_id, "name": report.exercise.exercise_name} if report.exercise else None,
                "generated_at": report.generated_at,
                "pdf_file": report.pdf_file.url if report.pdf_file else None
            })

        exercises = Exercise.objects.all()
        exercises_data = [{"exercise_id": ex.exercise_id, "name": ex.exercise_name} for ex in exercises]

        return JsonResponse({
            "profile": profile_data,
            "reports": reports_data,
            "exercises": exercises_data
        })

class UpdateProfileAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.method != "POST":
            return JsonResponse({"success": False, "error": "POST request required"}, status=405)
        try:
            data = request.data
            user = request.user
            profile = getattr(user, "profile", None)
            if not profile:
                return JsonResponse({"success": False, "error": "Profile not found"}, status=404)

            user.first_name = data.get("first_name", user.first_name)
            user.last_name = data.get("last_name", user.last_name)
            user.username = data.get("username", user.username)
            user.save()

            age = data.get("age")
            gender = data.get("gender")
            if age:
                profile.age = int(age)
            if gender:
                profile.gender = gender
            profile.save()

            return JsonResponse({"success": True})
        except Exception as e:
            traceback.print_exc()
            return JsonResponse({"success": False, "error": str(e)}, status=500)

class UpdateProfilePictureAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.method == 'POST' and request.FILES.get('profile_picture'):
            profile = request.user.profile
            profile.profile_picture = request.FILES['profile_picture']
            profile.save()
            full_url = request.build_absolute_uri(profile.profile_picture.url)
            return JsonResponse({'status': 'success', 'image_url': full_url})
        return JsonResponse({'status': 'error', 'message': 'Invalid request'}, status=400)

# ---------------------------
# EXERCISES
# ---------------------------
@api_view(['GET'])
def exercises_api(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Unauthorized"}, status=401)
    exercises = Exercise.objects.all()
    data = [
        {
            "exercise_id": e.exercise_id,
            "exercise_name": e.exercise_name,
            "description": e.description,
            "target_muscle": e.target_muscle,
            "difficulty_level": e.difficulty_level,
            "video_demo_url": e.video_demo_url
        } for e in exercises
    ]
    return JsonResponse(data, safe=False)

# ---------------------------
# AUTHENTICATION
# ---------------------------
EMAIL_REGEX = r"^[\w\.-]+@[\w\.-]+\.\w+$"
OTP_STORE = {}

@csrf_exempt
@api_view(['POST'])
def login_api(request):
    if request.method != "POST":
        return JsonResponse({"success": False, "error": "POST request required"})

    try:
        data = request.data
        identifier = data.get("identifier", "").strip()
        password = data.get("password", "").strip()
    except json.JSONDecodeError:
        return JsonResponse({"success": False, "error": "Invalid JSON"})

    if not identifier:
        return JsonResponse({"success": False, "error": "Username or email is required"})
    if not password:
        return JsonResponse({"success": False, "error": "Password is required"})

    user = None
    if not re.match(EMAIL_REGEX, identifier):
        user = authenticate(request, username=identifier, password=password)
        if not user:
            return JsonResponse({"success": False, "error": "No account found. Sign up!"})
    else:
        user_obj = User.objects.filter(email__iexact=identifier).first()
        if not user_obj:
            return JsonResponse({"success": False, "error": "No account found. Sign up!"})
        user = authenticate(request, username=user_obj.username, password=password)
        if not user:
            return JsonResponse({"success": False, "error": "Incorrect password for this email."})

    if not user.is_active:
        return JsonResponse({"success": False, "error": "Account is inactive"})

    if user.is_staff or user.is_superuser:
        return JsonResponse({"success": False, "error": "Admin cannot log in from user portal"})

    login(request, user)
    refresh = RefreshToken.for_user(user)

    return JsonResponse({"success": True, "username": user.username, "role": user.is_staff and "admin" or "user",
                         "access": str(refresh.access_token),
                         "refresh": str(refresh)})

@csrf_exempt
@api_view(['POST'])
def send_otp(request):
    if request.method != "POST":
        return JsonResponse({"success": False, "error": "POST request required"}, status=405)
    try:
        data = request.data
        email = data.get("email")
        if not email:
            return JsonResponse({"success": False, "error": "Email required"}, status=400)
        user = User.objects.filter(email=email).first()
        if not user:
            return JsonResponse({"success": False, "error": "Email not registered"}, status=404)

        otp = str(randint(1000, 9999))
        OTP_STORE[email] = {"otp": otp, "created_at": timezone.now()}

        subject = "Your TheraTrack OTP Code"
        message = f"""
Dear {user.first_name or 'User'},

We received a request to reset your TheraTrack account password.
Please use the following One-Time Password (OTP) to proceed:

OTP Code: {otp}

This OTP is valid for 2 minutes. Please do not share this code with anyone.

If you did not request this, please ignore this email or contact TheraTrack support immediately.

Thank you,
The TheraTrack Team
support.theratrack@gmail.com
"""
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email], fail_silently=False)
        return JsonResponse({"success": True, "message": "OTP sent to email"})
    except Exception as e:
        traceback.print_exc()
        return JsonResponse({"success": False, "error": str(e)}, status=500)

@csrf_exempt
@api_view(['POST'])
def verify_otp(request):
    if request.method != "POST":
        return JsonResponse({"success": False, "error": "POST request required"}, status=405)
    try:
        data = request.data
        email = data.get("email")
        otp = data.get("otp")
        if not email or not otp:
            return JsonResponse({"success": False, "error": "Email and OTP required"}, status=400)
        otp_entry = OTP_STORE.get(email)
        if not otp_entry:
            return JsonResponse({"success": False, "error": "OTP not found or expired"}, status=400)
        if timezone.now() > otp_entry["created_at"] + timedelta(minutes=2):
            OTP_STORE.pop(email, None)
            return JsonResponse({"success": False, "error": "OTP expired"}, status=400)
        if otp_entry["otp"] != otp:
            return JsonResponse({"success": False, "error": "Invalid OTP"}, status=400)
        return JsonResponse({"success": True, "message": "OTP verified"})
    except Exception as e:
        traceback.print_exc()
        return JsonResponse({"success": False, "error": str(e)}, status=500)

@csrf_exempt
@api_view(['POST'])
def reset_password(request):
    if request.method != "POST":
        return JsonResponse({"success": False, "error": "POST request required"}, status=405)
    try:
        data = request.data
        email = str(data.get("email", "")).strip()
        otp = str(data.get("otp", "")).strip()
        new_password = str(data.get("new_password", "")).strip()
        confirm_password = str(data.get("confirm_password", "")).strip()

        if not all([email, otp, new_password, confirm_password]):
            return JsonResponse({"success": False, "error": "All fields are required"}, status=400)
        otp_entry = OTP_STORE.get(email)
        if not otp_entry:
            return JsonResponse({"success": False, "error": "Invalid OTP"}, status=400)
        if str(otp_entry["otp"]).strip() != otp:
            return JsonResponse({"success": False, "error": "Invalid OTP"}, status=400)
        if timezone.now() > otp_entry["created_at"] + timedelta(minutes=2):
            OTP_STORE.pop(email, None)
            return JsonResponse({"success": False, "error": "OTP expired"}, status=400)
        if new_password != confirm_password:
            return JsonResponse({"success": False, "error": "Passwords do not match"}, status=400)
        user = User.objects.get(email=email)
        if user.check_password(new_password):
            return JsonResponse({"success": False, "error": "New password cannot be the same as old password"}, status=400)
        user.set_password(new_password)
        user.save()
        OTP_STORE.pop(email, None)
        return JsonResponse({"success": True})
    except User.DoesNotExist:
        return JsonResponse({"success": False, "error": "User not found"}, status=404)
    except Exception as e:
        traceback.print_exc()
        return JsonResponse({"success": False, "error": "Something went wrong"}, status=500)

# ---------------------------
# GOOGLE LOGIN
# ---------------------------
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

@csrf_exempt
@api_view(['POST'])
def google_login(request):
    if request.method != "POST":
        return JsonResponse({"success": False, "error": "Invalid method"}, status=405)
    try:
        body = request.data
        token = body.get("token")
        if not token:
            return JsonResponse({"success": False, "error": "Token missing"})
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), GOOGLE_CLIENT_ID)
        email = idinfo.get("email")
        first_name = idinfo.get("given_name", "")
        last_name = idinfo.get("family_name", "")
        profile_picture = idinfo.get("picture")
        if not email:
            return JsonResponse({"success": False, "error": "Email not found in token"})
        user, created = User.objects.get_or_create(username=email, defaults={"email": email, "first_name": first_name, "last_name": last_name})
        user.first_name = first_name
        user.last_name = last_name
        user.save()
        profile, created = Profile.objects.get_or_create(user=user, defaults={"google_flag": True, "profile_picture": profile_picture or None})
        profile.google_flag = True
        if profile_picture:
            profile.profile_picture = profile_picture
        profile.save()
        backend = get_backends()[0]
        login(request, user, backend=backend.__class__.__module__ + "." + backend.__class__.__name__)
        tokens = get_tokens_for_user(user)
        return JsonResponse({
            "success": True,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "age": profile.age,
            "gender": profile.gender,
            "profile_picture": profile.profile_picture.url if profile.profile_picture else None,
            "is_google": profile.google_flag,
            "access": tokens['access'],
            "refresh": tokens['refresh']
        })
    except ValueError as ve:
        return JsonResponse({"success": False, "error": f"Invalid Google token: {str(ve)}"})
    except Exception as e:
        return JsonResponse({"success": False, "error": f"Unexpected error: {str(e)}"})

# ---------------------------
# REGISTER
# ---------------------------
@csrf_exempt
@api_view(['POST'])
def register_api(request):
    if request.method != "POST":
        return JsonResponse({"success": False, "error": "Only POST allowed"}, status=405)
    try:
        data = request.data
        username = data.get("username", "").strip()
        first_name = data.get("firstName", "").strip()
        last_name = data.get("lastName", "").strip()
        email = data.get("email", "").strip()
        password1 = data.get("password1", "")
        password2 = data.get("password2", "")
        age = data.get("age")
        gender = data.get("gender", "").strip()
        if User.objects.filter(username=username).exists():
            return JsonResponse({"success": False, "error": "Username already exists!"}, status=400)
        if User.objects.filter(email__iexact=email).exists():
            return JsonResponse({"success": False, "error": "Email already registered!"}, status=400)
        user = User.objects.create_user(username=username, password=password1, email=email, first_name=first_name, last_name=last_name)
        try:
            age_value = int(age) if age else None
        except:
            age_value = None
        Profile.objects.get_or_create(user=user, defaults={"age": age_value, "gender": gender or None})
        return JsonResponse({"success": True, "message": "Account successfully registered"})
    except Exception as e:
        traceback.print_exc()
        return JsonResponse({"success": False, "error": str(e)}, status=500)

# ---------------------------
# LOGOUT
# ---------------------------
@csrf_exempt
@api_view(['POST'])
def logout_view_api(request):
    logout(request)
    return JsonResponse({"success": True})

# ---------------------------
# COOKIE CONSENT
# ---------------------------
@csrf_exempt
@api_view(['GET'])
def get_cookie_consent(request):
    user = request.user

    if not user or not user.is_authenticated:
        return JsonResponse({
            "isLoggedIn": False,
            "cookiesAccepted": False
        })

    profile = getattr(user, "profile", None)

    return JsonResponse({
        "isLoggedIn": True,
        "cookiesAccepted": profile.cookies_accepted if profile else False
    })

@csrf_exempt
@api_view(['POST'])
def set_cookie_consent(request):
    if not request.user.is_authenticated:
        return JsonResponse({"success": False, "error": "Login required"}, status=403)

    profile = request.user.profile
    profile.cookies_accepted = True
    profile.save()

    return JsonResponse({"success": True})

# ---------------------------
# WORKOUT / REPETITIONS / FEEDBACK / REPORTS
# ---------------------------
@csrf_exempt
@api_view(['POST'])
def save_workout_session_api(request):
    if request.method != "POST":
        return JsonResponse({"success": False, "error": "POST required"}, status=400)
    try:
        data = request.data
        session_id = data.get("session_id")
        exercise_id = data.get("exercise_id")
        duration_seconds = data.get("duration_seconds")
        if session_id:
            session = get_object_or_404(WorkoutSession, pk=session_id)
            session.end_time = timezone.now()
            if duration_seconds is not None:
                session.duration = timedelta(seconds=duration_seconds)
            session.status = "Completed"
            session.save()
        else:
            session = WorkoutSession.objects.create(user=request.user, exercise_id=exercise_id, start_time=timezone.now(), end_time=None, duration=None, device_type="Webcam", status="In Progress")
        return JsonResponse({"success": True, "session_id": session.session_id})
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)
    
# ---------------------------
# SAVE REPETITIONS
# ---------------------------
@csrf_exempt
@api_view(['POST'])
def save_repetitions_api(request):
    if request.method != "POST":
        return JsonResponse({"success": False, "error": "POST required"}, status=400)
    try:
        data = request.data
        session_id = data.get("session_id")
        reps = data.get("reps", [])
        session = get_object_or_404(WorkoutSession, pk=session_id)

        for i, r in enumerate(reps, start=1):
            rep = Repetition.objects.create(
                session=session,
                count_number=i,
                posture_accuracy=r.get("posture_accuracy", 0)
            )

            Feedback.objects.create(
                user=session.user,
                session=session,
                repetition=rep,
                feedback_text=r.get("feedback_text"),
                accuracy_score=r.get("posture_accuracy"),
            )
        return JsonResponse({"success": True})
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)

# ---------------------------
# SAVE FEEDBACK
# ---------------------------
@csrf_exempt
@api_view(['POST'])
def save_feedback_api(request):
    if request.method != "POST":
        return JsonResponse({"success": False, "error": "POST required"}, status=400)
    try:
        data = request.data
        session_id = data.get("session_id")
        feedback_text = data.get("feedback_text", "")
        accuracy_score = float(data.get("accuracy_score", 0))
        session = get_object_or_404(WorkoutSession, pk=session_id)
        Feedback.objects.create(
            user=session.user,
            session=session,
            feedback_text=feedback_text,
            accuracy_score=accuracy_score,
            ai_model=None
        )
        return JsonResponse({"success": True})
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)

# ---------------------------
# SAVE PDF REPORT
# ---------------------------
@csrf_exempt
@api_view(['POST'])
def save_report_api(request):
    if request.method != "POST":
        return JsonResponse({"success": False, "error": "POST required"}, status=400)
    try:
        data = request.data
        session_id = data.get("session_id")
        pdf_base64 = data.get("pdf_base64")
        generated_by = data.get("generated_by", "AI_Model")

        if not pdf_base64:
            return JsonResponse({"success": False, "error": "PDF data missing"}, status=400)

        session = get_object_or_404(WorkoutSession, pk=session_id)

        format, pdf_str = pdf_base64.split(';base64,')
        pdf_data = ContentFile(base64.b64decode(pdf_str), name=f"report_session_{session_id}.pdf")

        report = Report.objects.create(
            session=session,
            exercise=session.exercise,
            generated_by=generated_by,
            pdf_file=pdf_data
        )
        return JsonResponse({"success": True, "report_id": report.report_id})
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)

# ---------------------------
# Download PDF
# ---------------------------
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def download_report(request, report_id):
    """
    Download a report PDF based on report_id.
    Expects files in: MEDIA_ROOT/reports/report_session_<report_id>.pdf
    """
    try:
        report = Report.objects.get(pk=report_id, session__user=request.user)
    except Report.DoesNotExist:
        raise Http404("Report not found in database")

    # Use the session_id for the file name
    session_id = report.session_id  # <- make sure your Report model has a session FK
    pdf_path = os.path.join(settings.MEDIA_ROOT, 'reports', f'report_session_{session_id}.pdf')

    if not os.path.exists(pdf_path):
        raise Http404("PDF file does not exist")

    with open(pdf_path, "rb") as f:
        response = HttpResponse(f.read(), content_type="application/pdf")
        response['Content-Disposition'] = f'attachment; filename="report_session_{session_id}.pdf"'
        return response

# ---------------------------
# MEDIAPIPE POSE ANALYSIS
# ---------------------------
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
import mediapipe as mp
mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils

@login_required
@csrf_exempt
@api_view(['POST'])
def analyze_pose_api(request):
    body = request.data
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

    return JsonResponse({"landmarks": landmarks_list})

# ---------------------------
# CHAT
# ---------------------------
@csrf_exempt
@api_view(['POST'])
def chat_api(request):
    """
    POST /api/chat/
    """

    try:
        data = request.data if hasattr(request, "data") else {}
        user_message = data.get("message", "").strip()

        if not user_message:
            return JsonResponse({"reply": "Please type something."})

        # -------------------------------
        # SESSION HANDLING
        # -------------------------------
        session_id = data.get("session_id")

        if session_id:
            session, _ = ChatSession.objects.get_or_create(
                chatSession_id=session_id
            )
        else:
            session = ChatSession.objects.create()

        session.last_active = timezone.now()
        session.save()

        # -------------------------------
        # SAVE USER MESSAGE
        # -------------------------------
        ChatMessage.objects.create(
            chatSession_id=session,
            message_type="user",
            message_text=user_message
        )

        # -------------------------------
        # GET LAST MESSAGES (LIGHT CONTEXT)
        # -------------------------------
        messages = ChatMessage.objects.filter(
            chatSession_id=session
        ).order_by("timestamp")[:5]

        conversation_history = [
            {
                "role": "user" if m.message_type == "user" else "bot",
                "content": m.message_text
            }
            for m in messages
        ]

        # -------------------------------
        # GENERATE RESPONSE
        # -------------------------------
        try:
            reply_text = generate_response(user_message, conversation_history)
        except Exception:
            tb = traceback.format_exc()
            print("THERABOT ERROR:\n", tb, flush=True)

            reply_text = (
                "- Sit upright for 30 minutes.\n"
                "- Keep your screen at eye level.\n"
                "- Take breaks every 30 minutes."
            )

        # -------------------------------
        # SAVE BOT MESSAGE
        # -------------------------------
        ChatMessage.objects.create(
            chatSession_id=session,
            message_type="bot",
            message_text=reply_text
        )

        return JsonResponse({
            "reply": reply_text,
            "session_id": session.chatSession_id
        })

    except Exception:
        tb = traceback.format_exc()
        print("CHAT API ERROR:\n", tb, flush=True)

        return JsonResponse({
            "error": "Internal server error",
            "trace": tb
        }, status=500)
    
# ---------------------------
# CONTACT FORM
# ---------------------------
@api_view(['POST'])
def contact_api(request):
    Contact.objects.create(
        user=request.user if request.user.is_authenticated else None,
        name=request.data.get('name', ''),
        email=request.data.get('email', ''),
        message=request.data.get('message', ''),
        created_at=timezone.now()
    )
    return Response({"success": "Message submitted successfully"}, status=status.HTTP_201_CREATED)

@api_view(["POST"])
def collect_training_data(request):
    data = request.data

    features = data.get("features", {})
    label = 1 if data.get("label") == "correct" else 0

    if not isinstance(features, dict):
        return Response({"error": "Invalid features format"}, status=400)
    
    TrainingData.objects.create(
        exercise=data["exercise"],
        features=features,
        label=label
    )

    return Response({"success": True})

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, "ml_models")


# ---------------- FIND LATEST MODEL ----------------
def find_latest_model(exercise_name):
    try:
        exercise_name = exercise_name.lower().replace(" ", "")

        models = []

        for file in os.listdir(MODEL_DIR):
            f = file.lower().replace(" ", "")

            if exercise_name in f and f.endswith(".pkl") and "model" in f:
                models.append(file)

        if not models:
            return None

        # pick latest version (timestamp at end)
        models.sort(reverse=True)
        return os.path.join(MODEL_DIR, models[0])

    except Exception as e:
        print("FILE SEARCH ERROR:", e)
        return None


def find_scaler(exercise_name):
    try:
        exercise_name = exercise_name.lower().replace(" ", "")

        for file in os.listdir(MODEL_DIR):
            f = file.lower().replace(" ", "")

            if exercise_name in f and "scaler" in f:
                return os.path.join(MODEL_DIR, file)

        return None

    except Exception as e:
        print("SCALER SEARCH ERROR:", e)
        return None


# ---------------- VIEW ----------------
@api_view(["POST"])
def predict_posture(request):
    try:
        data = request.data
        features = data.get("features", {})
        exercise = (data.get("exercise") or "").lower().strip()

        if not isinstance(features, dict):
            return Response({"error": "Invalid features"}, status=400)

        model_path = find_latest_model(exercise)

        if not model_path:
            return Response({
                "error": f"No model found for {exercise}",
                "files_in_dir": os.listdir(MODEL_DIR)
            }, status=500)

        bundle = joblib.load(model_path)

        model = bundle["model"]          # ✅ actual ML model
        feature_list = bundle["features"]  # ✅ correct feature order

        # ---------------- BASE FEATURES ----------------
        knee = float(features.get("kneeAngle", 0))
        hip = float(features.get("hipAngle", 0))
        elbow = float(features.get("elbowAngle", 0))
        leg = float(features.get("legRaiseAngle", 0))

        # ---------------- ENGINEERED FEATURES ----------------
        X = pd.DataFrame([{
            "kneeAngle": knee,
            "hipAngle": hip,
            "elbowAngle": elbow,
            "legRaiseAngle": leg,

            "knee_hip_diff": abs(knee - hip),
            "hip_elbow_diff": abs(hip - elbow),
            "knee_elbow_diff": abs(knee - elbow),

            "body_balance": (knee + hip) / 2,
            "posture_stability": (knee + hip + elbow) / 3,

            "knee_depth": 180 - knee,
            "hip_opening": hip - 90,
            "arm_fold_ratio": elbow / 180
        }])

        # extract correct values in correct order
        input_data = [X.iloc[0][f] if f in X.columns else 0 for f in feature_list]

        # ensure correct shape
        input_array = np.array(input_data).reshape(1, -1)

        # predict
        pred = model.predict(input_array)[0]

        if hasattr(model, "predict_proba"):
            proba = model.predict_proba(input_array)[0]
            prob = float(proba[int(pred)])
        else:
            prob = 1.0

        return Response({
            "label": "correct" if int(pred) == 1 else "incorrect",
            "prob": prob,
            "exercise": exercise,
            "model_used": os.path.basename(model_path)
        })

    except Exception as e:
        print("PREDICT ERROR:", e)
        return Response({"error": str(e)}, status=500)