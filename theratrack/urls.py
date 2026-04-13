"""
URL configuration for physiocoach project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from posture import views
from django.conf.urls.static import static
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', TemplateView.as_view(template_name='index.html')),

    # Public / Auth APIs
    path('api/login/', views.login_api, name='login_api'),
    path('api/send-otp/', views.send_otp, name='send_otp'),
    path('api/verify-otp/', views.verify_otp, name='verify_otp'),
    path('api/google-login/', views.google_login, name='google-login'),
    path('api/register/', views.register_api, name='register_api'),
    path('api/reset-password/', views.reset_password, name='reset_password'),
    path('auth/', include('social_django.urls', namespace='social')),
    path('api/current_user/', views.current_user, name='current_user'),
    path('api/contact/', views.contact_api, name='contact_api'),

    # Protected APIs (login required)
    path('api/profile/', views.ProfileAPIView.as_view(), name='profile_api'),
    path('api/update_profile_picture/', views.UpdateProfilePictureAPIView.as_view(), name='update_profile_picture_api'),
    path('api/update_profile/', views.UpdateProfileAPIView.as_view(), name='update_profile'),
    path('api/exercises/', views.exercises_api, name='exercises_api'),
    path('api/logout/', views.logout_view_api, name='logout_api'),
    path('api/get-cookie-consent/', views.get_cookie_consent, name='get_cookie_consent'),
    path('api/set-cookie-consent/', views.set_cookie_consent, name='set_cookie_consent'),

    # Workout / Feedback / Reports
    path('api/save_workout_session/', views.save_workout_session_api, name='save_workout_session_api'),
    path('api/save_repetitions/', views.save_repetitions_api, name='save_repetitions_api'),
    path('api/save_feedback/', views.save_feedback_api, name='save_feedback_api'),
    path('api/save_report/', views.save_report_api, name='save_report_api'),
    path("api/download_report/<int:report_id>/", views.download_report, name="download_report"),
    # Pose Analysis
    path('api/analyze_pose/', views.analyze_pose_api, name='analyze_pose_api'),

    # Chatbot
    path('api/chat/', views.chat_api, name='chat_api'),

    path("api/collect_training_data/", views.collect_training_data, name='collect_training_data'),
    path("api/predict_posture/", views.predict_posture, name="predict_posture")
]
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)