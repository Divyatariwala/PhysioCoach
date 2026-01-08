# posture/views.py

from io import BytesIO
import google.genai as genai
from google.genai import types
import cv2
import base64
from fastapi.responses import FileResponse
import numpy as np
import json
import os
from django.contrib.auth import get_backends
from google.auth.transport import requests as google_requests
from django.http import Http404, FileResponse,  JsonResponse
from django.shortcuts import get_object_or_404, render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
import mediapipe as mp
from django.contrib.auth.models import User
from datetime import datetime, timedelta
from django.contrib.auth import update_session_auth_hash
from theratrack import settings
from xhtml2pdf import pisa  # for PDF generation
from django.template.loader import render_to_string
from django.views.decorators.csrf import csrf_exempt
from google.oauth2 import id_token
from rest_framework.response import Response
# Import your models
from .models import Profile, Exercise, WorkoutSession, Repetition, Report, Feedback, AIModel

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

@login_required
def filter_reports_api(request):
    """
    Return reports filtered by exercise as JSON
    """
    exercise_id = request.GET.get("exercise_id")

    if exercise_id == "all" or not exercise_id:
        reports = Report.objects.filter(session__user=request.user).order_by("-generated_at")
    else:
        reports = Report.objects.filter(session__user=request.user, exercise_id=exercise_id).order_by("-generated_at")

    reports_data = [
        {
            "id": r.report_id,
            "title": f"Report for Session {r.session.session_id}",
            "date": r.generated_at.strftime("%d %b %Y"),
            "file_url": r.pdf_file.url if r.pdf_file else None,
        }
        for r in reports
    ]

    return JsonResponse({"reports": reports_data})

@login_required
def download_report_api(request, report_id):
    report = get_object_or_404(Report, report_id=report_id)

    if not report.pdf_file or not os.path.exists(report.pdf_file.path):
        raise Http404("Report file missing")

    filename = os.path.basename(report.pdf_file.name)
    
    # Open file in binary mode
    file_handle = open(report.pdf_file.path, "rb")
    response = FileResponse(file_handle)
    
    # Force download by setting header manually
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    
    return response

@login_required
def exercises_api(request):
    exercises = Exercise.objects.all()

    # Prepare data for JS
    exercise_data = [
        {
            "id": e.exercise_id,
            "exercise_name": e.exercise_name,
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
# NORMAL LOGIN
# ---------------------------
@csrf_exempt
def login_api(request):
    if request.method != "POST":
        return JsonResponse({"success": False, "error": "POST request required"}, status=405)

    try:
        data = json.loads(request.body)
        username = data.get("username", "").strip()
        password = data.get("password", "").strip()
    except json.JSONDecodeError:
        return JsonResponse({"success": False, "error": "Invalid JSON"}, status=400)

    if not username or not password:
        return JsonResponse({"success": False, "error": "Username and password required"}, status=400)

    user = authenticate(request, username=username, password=password)

    if user is not None:
        backend = get_backends()[0]  
        login(
            request,
            user,
            backend=backend.__class__.__module__ + "." + backend.__class__.__name__
        )

        return JsonResponse({"success": True, "username": user.username})

    return JsonResponse({"success": False, "error": "Invalid username or password"}, status=403)

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
            return JsonResponse({"success": False, "error": "Username already exists"}, status=400)

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

@login_required
@csrf_exempt
def forgot_password_api(request):
    context = {}
    if request.method == "POST":
        data = json.loads(request.body)
        old_password = data.get("old_password")
        new_password = data.get("new_password")
        confirm_password = data.get("confirm_password")
        user = request.user

        if not user.check_password(old_password):
            context["old_password_error"] = "Old password is incorrect"
        else:
            user.set_password(new_password)
            user.save()
            update_session_auth_hash(request, user)
            context["success_message"] = "🎯 Password flawlessly upgraded! You’re now basically unhackable 😎🔐"

    return JsonResponse(context)

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

@login_required
def save_workout_session_api(request):
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
def save_repetitions_api(request):
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
def save_feedback_api(request):
    if request.method != "POST":
        return JsonResponse({"success": False, "error": "Invalid request"}, status=400)

    try:
        data = json.loads(request.body)
        print("save_feedback input:", data)

        session_id = data.get("session_id")
        feedback_text = data.get("feedback_text") or ""
        accuracy_score = float(data.get("accuracy_score") or 0)

        # Validate session
        session = get_object_or_404(WorkoutSession, pk=session_id, user=request.user)
        print("WorkoutSession found:", session)

        # Active AI model (optional)
        ai_model = AIModel.objects.filter(is_active=True).order_by("-last_updated").first()
        print("AI Model:", ai_model)

        # Save feedback entry
        feedback = Feedback.objects.create(
            user = request.user,
            session=session,
            feedback_text=feedback_text,
            accuracy_score=accuracy_score,
            ai_model=ai_model
        )
        print("Feedback saved successfully:", feedback)

        # Prepare data for PDF
        repetitions = list(session.repetitions.all())
        total_reps = len(repetitions)
        avg_accuracy = sum([r.posture_accuracy for r in repetitions]) / total_reps if total_reps else 0
        duration_seconds = session.duration.total_seconds() if session.duration else 0
        minutes, seconds = divmod(int(duration_seconds), 60)

        context = {
            "session": session,
            "repetitions": repetitions,
            "feedbacks": Feedback.objects.filter(session=session),
            "total_reps": total_reps,
            "avg_accuracy": avg_accuracy,
            "minutes": minutes,
            "seconds": seconds,
        }

        # Generate PDF safely
        pdf_file = BytesIO()
        html_string = render_to_string("posture/report_template.html", context)
        pdf_result = pisa.CreatePDF(html_string, dest=pdf_file)
        pdf_file.seek(0)

        if pdf_result.err:
            print("PDF generation failed")
            return JsonResponse({"success": False, "error": "Failed to generate PDF"}, status=500)

        # Save PDF to MEDIA
        reports_dir = os.path.join(settings.MEDIA_ROOT, "reports")
        os.makedirs(reports_dir, exist_ok=True)
        pdf_filename = f"report_session_{session.session_id}.pdf"
        pdf_path = os.path.join(reports_dir, pdf_filename)

        with open(pdf_path, "wb") as f:
            f.write(pdf_file.read())
        print("PDF saved:", pdf_path)

        # Save Report instance
        report = Report.objects.create(
            session=session,
            exercise_id=session.exercise.exercise_id,  # use exercise_id for FK
            generated_by="AI_Model",
            pdf_file=f"reports/{pdf_filename}"
        )

        return JsonResponse({
            "success": True,
            "report_id": report.report_id,
            "report_url": report.pdf_file.url
        })

    except Exception as e:
        import traceback
        print("Error in save_feedback:", e)
        traceback.print_exc()
        return JsonResponse({"success": False, "error": str(e)}, status=500)

# ---------------------------
# Mediapipe Pose Analysis
# ---------------------------

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"  # suppress TensorFlow logs
mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils

@login_required
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

# ---------------------------
# Initialize Gemini client once
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

@csrf_exempt
def generate_ai_response(request):
    if request.method != "POST":
        return JsonResponse({"error": "Invalid request method."}, status=400)

    try:
        data = json.loads(request.body.decode("utf-8"))
        user_message = data.get("message", "").strip()
        if not user_message:
            return JsonResponse({"reply": "Please type something."})

        model = "gemini-2.5-pro"

        # --- SYSTEM INSTRUCTION (FIXED) ---
        system_prompt = """
You are an AI Therapy Support Assistant for TheraTrak, a digital therapy-tracking and home-exercise system. 
Your job is to help participants, caregivers, and therapists by giving clear, safe and supportive guidance.

Goals
- Help users understand & complete their therapy exercises
- Encourage consistency and motivation
- Explain TheraTrak web + mobile app features clearly
- Collect feedback (pain, difficulty, mood, reps)
- Provide safe advice only, never medical diagnosis
- Explain how exercise tracking & analysis works when asked

Special: When asked "how to use the TheraTrak app/website for exercise analyzing"
Always:
1. Explain how to log exercises
2. Explain how to record feedback (pain, reps, mood, difficulty)
3. Explain how progress graphs and reports work
4. Explain how therapists review the data
5. Follow safety language: “If anything feels painful or confusing, pause and let your therapist know.”

Never refuse or redirect these feature-usage questions unless it's medical advice.

Safety
- Do not prescribe or diagnose
- Do not modify exercise programs
- If pain, injury or distress → advise to contact therapist/medical help

Tone
- Warm, friendly, calm, supportive
- Short, simple guidance
- End with one gentle follow-up question when relevant

Examples:
- “You’re making great progress!”
- “Let’s take it one step at a time.”
- “Tell me how that exercise felt afterward.”
"""

        contents = [
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=user_message)],
            )
        ]

        generate_config = types.GenerateContentConfig(
            temperature=0.7,
            system_instruction=system_prompt
        )

        reply_text = ""
        for chunk in client.models.generate_content_stream(
            model=model,
            contents=contents,
            config=generate_config,
        ):
            if chunk.candidates and chunk.candidates[0].content.parts:
                part = chunk.candidates[0].content.parts[0]
                if part.text:
                    reply_text += part.text

        return JsonResponse({"reply": reply_text})

    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
