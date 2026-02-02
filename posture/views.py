# posture/views.py

from io import BytesIO
from random import randint
from django.utils import timezone
import traceback
import cv2
import base64
import numpy as np
import json
import os
import re
from django.core.mail import send_mail
from rest_framework import status
from rest_framework.decorators import api_view
from django.core.files.base import ContentFile
from django.contrib.auth import get_backends
from google.auth.transport import requests as google_requests
from django.http import Http404, FileResponse,  JsonResponse
from django.shortcuts import get_object_or_404, render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
import mediapipe as mp
from django.contrib.auth.models import User
from datetime import datetime, timedelta
from theratrack import settings
from xhtml2pdf import pisa  # for PDF generation
from django.template.loader import render_to_string
from django.views.decorators.csrf import csrf_exempt
from google.oauth2 import id_token
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .ai import generate_response
# Import your models
from .models import ChatMessage, ChatSession, Contact, Profile, Exercise, WorkoutSession, Repetition, Report, Feedback, AIModel

@login_required
def profile_api(request):
    if not request.user.is_authenticated:
        return JsonResponse({"success": False, "error": "Authentication required"}, status=401)

    user = request.user
    profile = getattr(user, "profile", None)

    # User profile info
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

    # Reports tied to the user's sessions
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

    # Exercises
    exercises = Exercise.objects.all()
    exercises_data = [{"exercise_id": ex.exercise_id, "name": ex.exercise_name} for ex in exercises]

    return JsonResponse({
        "profile": profile_data,
        "reports": reports_data,
        "exercises": exercises_data
    })

@csrf_exempt
@login_required
def update_profile_picture_api(request):
    if request.method == 'POST' and request.FILES.get('profile_picture'):
        profile = request.user.profile  # Assuming OneToOne relation to User
        profile.profile_picture = request.FILES['profile_picture']
        profile.save()
        # Return full URL for frontend
        full_url = request.build_absolute_uri(profile.profile_picture.url)
        return JsonResponse({'status': 'success', 'image_url': full_url})
    
    return JsonResponse({'status': 'error', 'message': 'Invalid request'}, status=400)

@login_required
@csrf_exempt
def update_profile(request):
    if request.method != "POST":
        return JsonResponse({"success": False, "error": "POST request required"}, status=405)

    try:
        data = json.loads(request.body.decode("utf-8"))
        user = request.user
        profile = getattr(user, "profile", None)

        if not profile:
            return JsonResponse({"success": False, "error": "Profile not found"}, status=404)

        # Update User fields
        user.first_name = data.get("first_name", user.first_name)
        user.last_name = data.get("last_name", user.last_name)
        user.username = data.get("username", user.username)
        user.save()

        # Update Profile fields
        age = data.get("age")
        gender = data.get("gender")
        if age:
            profile.age = int(age)
        if gender:
            profile.gender = gender
        profile.save()

        return JsonResponse({"success": True})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({"success": False, "error": str(e)}, status=500)

@csrf_exempt
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
# NORMAL LOGIN
# ---------------------------
EMAIL_REGEX = r"^[\w\.-]+@[\w\.-]+\.\w+$"

@csrf_exempt
def login_api(request):
    if request.method != "POST":
        return JsonResponse({"success": False, "error": "POST request required"})

    try:
        data = json.loads(request.body)
        identifier = data.get("identifier", "").strip()
        password = data.get("password", "").strip()
    except json.JSONDecodeError:
        return JsonResponse({"success": False, "error": "Invalid JSON"})

    # ---------------- VALIDATION ----------------
    if not identifier:
        return JsonResponse({"success": False, "error": "Username or email is required"})
    if not password:
        return JsonResponse({"success": False, "error": "Password is required"})

    user = None

    # ---------------- LOGIN LOGIC ----------------
    if not re.match(EMAIL_REGEX, identifier):
        # Check username
        user = authenticate(request, username=identifier, password=password)
        if not user:
            return JsonResponse({
                "success": False,
                "error": "No account found. Sign up!"
            })
    else:
        # Check email
        user_obj = User.objects.filter(email__iexact=identifier).first()
        if not user_obj:
            return JsonResponse({
                "success": False,
                "error": "No account found. Sign up!"
            })
        user = authenticate(request, username=user_obj.username, password=password)
        if not user:
            return JsonResponse({
                "success": False,
                "error": "Incorrect password for this email."
            })

    if not user.is_active:
        return JsonResponse({"success": False, "error": "Account is inactive"})

    if user.is_staff or user.is_superuser:
        return JsonResponse({
            "success": False,
            "error": "Admin cannot log in from user portal"
        })

    login(request, user)

    # JWT tokens (optional)
    refresh = RefreshToken.for_user(user)
    
    return JsonResponse({"success": True, "username": user.username,"role": user.is_staff and "admin" or "user",
        "access": str(refresh.access_token),
        "refresh": str(refresh),})

# Temporary OTP store
OTP_STORE = {}

@csrf_exempt
def send_otp(request):
    if request.method != "POST":
        return JsonResponse({"success": False, "error": "POST request required"}, status=405)

    try:
        data = json.loads(request.body.decode("utf-8"))
        email = data.get("email")
        if not email:
            return JsonResponse({"success": False, "error": "Email required"}, status=400)

        user = User.objects.filter(email=email).first()
        if not user:
            return JsonResponse({"success": False, "error": "Email not registered"}, status=404)

        # Generate 4-digit OTP
        otp = str(randint(1000, 9999))
        # Store OTP with timestamp
        OTP_STORE[email] = {
            "otp": otp,
            "created_at": timezone.now()
        }

        # Prepare professional email
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
noreply.theratrack@gmail.com
"""
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )

        return JsonResponse({"success": True, "message": "OTP sent to email"})

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({"success": False, "error": str(e)}, status=500)

@csrf_exempt
def verify_otp(request):
    if request.method != "POST":
        return JsonResponse({"success": False, "error": "POST request required"}, status=405)
    
    try:
        data = json.loads(request.body.decode("utf-8"))
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
        import traceback
        traceback.print_exc()
        return JsonResponse({"success": False, "error": str(e)}, status=500)

@csrf_exempt
def reset_password(request):
    if request.method != "POST":
        return JsonResponse({"success": False, "error": "POST request required"}, status=405)

    try:
        data = json.loads(request.body.decode("utf-8"))
        email = str(data.get("email", "")).strip()
        otp = str(data.get("otp", "")).strip()
        new_password = str(data.get("new_password", "")).strip()
        confirm_password = str(data.get("confirm_password", "")).strip()

        # Check for empty fields
        if not all([email, otp, new_password, confirm_password]):
            return JsonResponse({"success": False, "error": "All fields are required"}, status=400)

        # ✅ Check OTP existence
        otp_entry = OTP_STORE.get(email)
        if not otp_entry:
            return JsonResponse({"success": False, "error": "Invalid OTP"}, status=400)

        # ✅ Ensure OTP comparison is string and trimmed
        if str(otp_entry["otp"]).strip() != otp:
            return JsonResponse({"success": False, "error": "Invalid OTP"}, status=400)

        # ✅ Check OTP expiry (2 minutes)
        if timezone.now() > otp_entry["created_at"] + timedelta(minutes=2):
            OTP_STORE.pop(email, None)
            return JsonResponse({"success": False, "error": "OTP expired"}, status=400)

        # ✅ Password match check
        if new_password != confirm_password:
            return JsonResponse({"success": False, "error": "Passwords do not match"}, status=400)

        # ✅ Fetch user
        user = User.objects.get(email=email)

        # 🔒 New password must not match old password
        if user.check_password(new_password):
            return JsonResponse({"success": False, "error": "New password cannot be the same as old password"}, status=400)

        # ✅ Save new password
        user.set_password(new_password)
        user.save()

        # 🧹 Remove OTP after success
        OTP_STORE.pop(email, None)

        return JsonResponse({"success": True})

    except User.DoesNotExist:
        return JsonResponse({"success": False, "error": "User not found"}, status=404)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({"success": False, "error": "Something went wrong"}, status=500)
# ---------------------------
# GOOGLE LOGIN
# ---------------------------
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

@csrf_exempt
def google_login(request):
    if request.method != "POST":
        return JsonResponse({"success": False, "error": "Invalid method"}, status=405)

    try:
        body = json.loads(request.body)
        token = body.get("token")
        if not token:
            return JsonResponse({"success": False, "error": "Token missing"})

        idinfo = id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            GOOGLE_CLIENT_ID
        )

        email = idinfo.get("email")
        first_name = idinfo.get("given_name", "")
        last_name = idinfo.get("family_name", "")
        profile_picture = idinfo.get("picture")

        if not email:
            return JsonResponse({"success": False, "error": "Email not found in token"})

        # Create user if not exists
        user, created = User.objects.get_or_create(
            username=email,
            defaults={"email": email, "first_name": first_name, "last_name": last_name},
        )

        # Always update first & last name
        user.first_name = first_name
        user.last_name = last_name
        user.save()

        # Create profile with default age & gender if it doesn't exist
        profile, created = Profile.objects.get_or_create(
            user=user,
            defaults={
                "google_flag": True,
                "profile_picture": profile_picture or None,
            }
        )

        # Always update Google flag & picture
        profile.google_flag = True
        if profile_picture:
            profile.profile_picture = profile_picture
        profile.save()

        # Log in user
        backend = get_backends()[0]
        login(request, user, backend=backend.__class__.__module__ + "." + backend.__class__.__name__)

        # Return full profile info for frontend
        return JsonResponse({
            "success": True,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "age": profile.age,
            "gender": profile.gender,
            "profile_picture": profile.profile_picture.url if profile.profile_picture else None,
            "is_google": profile.google_flag
        })

    except ValueError as ve:
        return JsonResponse({"success": False, "error": f"Invalid Google token: {str(ve)}"})
    except Exception as e:
        return JsonResponse({"success": False, "error": f"Unexpected error: {str(e)}"})

# ---------------------------
# REGISTER VIEW
# ---------------------------
@csrf_exempt
def register_api(request):
    if request.method != "POST":
        return JsonResponse({"success": False, "error": "Only POST allowed"}, status=405)

    try:
        # Parse JSON safely
        data = json.loads(request.body.decode("utf-8"))

        username = data.get("username", "").strip()
        first_name = data.get("firstName", "").strip()
        last_name = data.get("lastName", "").strip()
        email = data.get("email", "").strip()
        password1 = data.get("password1", "")
        password2 = data.get("password2", "")
        age = data.get("age")
        gender = data.get("gender", "").strip()

        # Validations
        if User.objects.filter(username=username).exists():
            return JsonResponse({"success": False, "error": "Username already exists!"}, status=400)

        if User.objects.filter(email__iexact=email).exists():
            return JsonResponse(
                {"success": False, "error": "Email already registered!"},
                status=400
            )
        
        # Create user
        user = User.objects.create_user(
            username=username,
            password=password1,
            email=email,
            first_name=first_name,
            last_name=last_name
        )

        # Convert age safely
        try:
            age_value = int(age) if age else None
        except:
            age_value = None

        # Create profile
        Profile.objects.get_or_create(
            user=user,
            defaults={"age": age_value, "gender": gender or None}
        )

        return JsonResponse({"success": True, "message": "Account successfully registered"})

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({"success": False, "error": str(e)}, status=500)
 
@csrf_exempt
def get_cookie_consent(request):
    return JsonResponse({
        "cookiesAccepted": request.session.get("cookies_accepted", False),
        "isLoggedIn": request.user.is_authenticated
    })

@csrf_exempt  # only if testing
def set_cookie_consent(request):
    if not request.user.is_authenticated:
        return JsonResponse({"success": False, "error": "Login required"}, status=403)

    if request.method != "POST":
        return JsonResponse({"success": False, "error": "POST required"}, status=405)

    import json
    try:
        data = json.loads(request.body)
        consent = data.get("cookiesAccepted", False)
        request.session["cookies_accepted"] = consent
        return JsonResponse({"success": True})
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=400)

def logout_view_api(request):
    logout(request)
     # If user logged out from admin panel
    if request.path.startswith('/admin'):
        return redirect('/admin/login/')

    # Otherwise (normal website logout)
    return redirect('exercises')


# ---------------------------
# Workout & Repetitions
# ---------------------------
@csrf_exempt
def save_workout_session_api(request):
    """
    Create a new session (start) or update an existing session (stop) with duration.
    """
    if request.method != "POST":
        return JsonResponse({"success": False, "error": "POST required"}, status=400)
    
    try:
        data = json.loads(request.body)
        session_id = data.get("session_id")
        exercise_id = data.get("exercise_id")
        duration_seconds = data.get("duration_seconds")  # may be None at start

        if session_id:
            # Stop / update session
            session = get_object_or_404(WorkoutSession, pk=session_id)
            session.end_time = timezone.now()
            if duration_seconds is not None:
                session.duration = timezone.timedelta(seconds=duration_seconds)
            session.status = "Completed"
            session.save()
        else:
            # Start new session
            session = WorkoutSession.objects.create(
                user=request.user,
                exercise_id=exercise_id,
                start_time=timezone.now(),
                end_time=None,
                duration=None,
                device_type="Webcam",
                status="In Progress"
            )

        return JsonResponse({
            "success": True,
            "session_id": session.session_id
        })

    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)

# ------------------- Save Repetitions -------------------
@csrf_exempt
def save_repetitions_api(request):
    if request.method != "POST":
        return JsonResponse({"success": False, "error": "POST required"}, status=400)

    try:
        data = json.loads(request.body)
        session_id = data.get("session_id")
        reps = data.get("reps", [])

        session = get_object_or_404(WorkoutSession, pk=session_id)

        for r in reps:
            # Save repetition
            rep = Repetition.objects.create(
                session=session,
                count_number=r.get("rep_number", 0),
                posture_accuracy=r.get("posture_accuracy", 0)
            )
            # Save feedback for this rep
            Feedback.objects.create(
                user=session.user,
                session=session,
                feedback_text=r.get("feedback_text", ""),
                accuracy_score=r.get("posture_accuracy", 0),
                ai_model=None
            )

        return JsonResponse({"success": True})

    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)


# ------------------- Save Feedback -------------------
@csrf_exempt
def save_feedback_api(request):
    if request.method != "POST":
        return JsonResponse({"success": False, "error": "POST required"}, status=400)

    try:
        data = json.loads(request.body)
        session_id = data.get("session_id")
        feedback_text = data.get("feedback_text", "")
        accuracy_score = float(data.get("accuracy_score", 0))

        # 1️⃣ Get session
        session = get_object_or_404(WorkoutSession, pk=session_id)

        # 2️⃣ Save feedback only
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
    
# ------------------- Save PDF File to Reports Folder -------------------
@csrf_exempt
def save_report_api(request):
    if request.method != "POST":
        return JsonResponse({"success": False, "error": "POST required"}, status=400)

    try:
        data = json.loads(request.body)
        session_id = data.get("session_id")
        pdf_base64 = data.get("pdf_base64")
        generated_by = data.get("generated_by", "AI_Model")

        if not pdf_base64:
            return JsonResponse({"success": False, "error": "PDF data missing"}, status=400)

        session = get_object_or_404(WorkoutSession, pk=session_id)

        # Convert base64 PDF to Django file
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
# Mediapipe Pose Analysis
# ---------------------------

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"  # suppress TensorFlow logs
mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils

@login_required
@csrf_exempt
def analyze_pose_api(request):
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

@csrf_exempt
def chat_api(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST request required"}, status=400)

    try:

        # -------------------------------
        # Load user message from request
        # -------------------------------
        data = json.loads(request.body)
        user_message = data.get("message", "").strip()
        if not user_message:
            return JsonResponse({"reply": "Please type something."})

        # -------------------------------
        # Get or create chat session
        # -------------------------------
        session_id = data.get("session_id")
        if session_id:
            session, _ = ChatSession.objects.get_or_create(chatSession_id=session_id)
        else:
            session = ChatSession.objects.create()

        session.last_active = timezone.now()
        session.save()

        # -------------------------------
        # Save user message
        # -------------------------------
        ChatMessage.objects.create(
            chatSession_id=session,
            message_type="user",
            message_text=user_message
        )

        # -------------------------------
        # Build conversation history (last 20 messages)
        # -------------------------------
        messages = ChatMessage.objects.filter(chatSession_id=session).order_by("timestamp")
        chat_history = []
        for msg in messages:
            role = "User" if msg.message_type == "user" else "Bot"
            chat_history.append(f"{role}: {msg.message_text}")
        chat_history = chat_history[-20:]  # Keep last 20 messages

        # Join messages into a single prompt for the model
        prompt = "\n".join(chat_history)

        # -------------------------------
        # Generate bot reply
        # -------------------------------
        reply_text = generate_response(user_message)

        # -------------------------------
        # Save bot reply
        # -------------------------------
        ChatMessage.objects.create(
            chatSession_id=session,
            message_type="bot",
            message_text=reply_text
        )

        return JsonResponse({"reply": reply_text, "session_id": session.chatSession_id})

    except Exception as e:
        tb = traceback.format_exc()
        print(f"[ERROR] {tb}", flush=True)
        return JsonResponse({"error": str(e), "trace": tb}, status=500)
    
@api_view(['POST'])
def contact_api(request):
    """
    Stores contact form data.
    All fields are optional to support full anonymity.
    """

    Contact.objects.create(
        user=request.user if request.user.is_authenticated else None,
        name=request.data.get('name', ''),
        email=request.data.get('email', ''),
        message=request.data.get('message', ''),
        created_at=timezone.now()
    )

    return Response(
        {"success": "Message submitted successfully"},
        status=status.HTTP_201_CREATED
    )

