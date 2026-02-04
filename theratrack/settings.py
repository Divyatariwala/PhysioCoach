"""
Django settings for theratrack project.

Configured for ngrok public access for both frontend and backend.
"""

from pathlib import Path
import os
from dotenv import load_dotenv

load_dotenv()  

# ----------------------
# BASE DIRECTORY
# ----------------------
BASE_DIR = Path(__file__).resolve().parent.parent

# ----------------------
# SECURITY SETTINGS
# ----------------------
SECRET_KEY = 'django-insecure-_rb$s9mtdy2!25$1jtban2_wc23o_a(c=c6_fz5fn@eu-+vkr='
DEBUG = True
ALLOWED_HOSTS = ["localhost", "127.0.0.1"]  

# ----------------------
# INSTALLED APPS
# ----------------------
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'posture',          # Your app
    'rest_framework',   # DRF
    'corsheaders',      # For CORS
]

# ----------------------
# REST FRAMEWORK SETTINGS
# ----------------------
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
}

AUTHENTICATION_BACKENDS = (
    'django.contrib.auth.backends.ModelBackend',
)

# ----------------------
# MIDDLEWARE
# ----------------------
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# Allow local frontend and ngrok frontend
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",       # Local React frontend
    "http://127.0.0.1:3000",
]

CORS_ALLOW_ALL_ORIGINS = True  # only for testing
CORS_ALLOW_CREDENTIALS = True
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
SESSION_COOKIE_HTTPONLY = True

# ----------------------
# EMAIL CONFIGURATION
# ----------------------
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "smtp.gmail.com"
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = "noreply.theratrack@gmail.com"
EMAIL_HOST_PASSWORD = "qohc mmln qxks nirx"
DEFAULT_FROM_EMAIL = "TheraTrack <noreply.theratrack@gmail.com>"

APP_URL = "http://localhost:3000"
# ----------------------
# URL CONFIGURATION
# ----------------------
ROOT_URLCONF = 'theratrack.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'posture' / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# Tell Django where static files are
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

WSGI_APPLICATION = 'theratrack.wsgi.application'

# ----------------------
# DATABASE
# ----------------------
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# ----------------------
# PASSWORD VALIDATION
# ----------------------
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',},
]

# ----------------------
# INTERNATIONALIZATION
# ----------------------
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'theratrack', 'media')

# ----------------------
# AUTH REDIRECTS
# ----------------------
LOGIN_URL = '/'
LOGOUT_REDIRECT_URL = '/'
LOGIN_REDIRECT_URL = '/'

# ----------------------
# STATIC FILES
# ----------------------
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# ----------------------
# DEFAULT AUTO FIELD
# ----------------------
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
