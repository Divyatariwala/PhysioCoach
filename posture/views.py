# posture/views.py

from io import BytesIO
import cv2
import base64
from django.forms import ValidationError
from fastapi.responses import FileResponse
import numpy as np
import json
import os
from django.http import Http404, FileResponse, HttpResponse, JsonResponse, StreamingHttpResponse
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
from theratrack import settings
from xhtml2pdf import pisa  # for PDF generation
from django.template.loader import render_to_string
from django.views.decorators.csrf import csrf_exempt
# Import your models
from .models import Profile, Exercise, WorkoutSession, Repetition, Report, Feedback, AIModel

@login_required
def profile_api(request):
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
        "profile_picture": profile.profile_picture.url if profile and profile.profile_picture else "/static/posture/images/default-avatar.png"
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
# LOGIN VIEW
# ---------------------------
@csrf_exempt
def login_api(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST request required"}, status=400)

    username = request.POST.get("username", "").strip()
    password = request.POST.get("password", "").strip()

    user = authenticate(request, username=username, password=password)

    if user is not None:
        login(request, user)
        return JsonResponse({"success": True, "username": user.username})
    else:
        return JsonResponse({"success": False, "error": "Invalid username or password"}, status=403)

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

