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
from django.urls import path
from django.conf import settings
from posture import views
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),

    # Basic Pages
    path('', views.home, name='home'),
    path('about/', views.about, name='about'),
    path('contact/', views.contact, name='contact'),
    path('profile/', views.profile, name='profile'),
    path('exercises/', views.exercises, name='exercises'),
    
   # Authentication
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
    path('forgot_password/', views.forgot_password, name='forgot_password'),
    path('logout/', views.logout_view, name='logout'),

    # Workout
    path('save_workout_session/', views.save_workout_session, name='save_workout_session'),
    path('save_repetitions/<uuid:session_id>/', views.save_repetitions, name='save_repetitions'),
    path('save_feedback/<int:session_id>/', views.save_feedback, name='save_feedback'),
    
    # Mediapipe Posture Analysis
    path('video_feed/', views.video_feed, name='video_feed'),
    path('analyze_pose/', views.analyze_pose, name='analyze_pose'),    

]+ static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
