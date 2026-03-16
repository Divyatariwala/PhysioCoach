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
SECRET_KEY = os.getenv("SECRET_KEY")
DEBUG = False
ALLOWED_HOSTS = [
    "localhost",
    "127.0.0.1",
    "theratrack-1-k5n9.onrender.com"
]

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

CSRF_TRUSTED_ORIGINS = [
    "https://theratrack-1-k5n9.onrender.com",
    "http://localhost:3000",
    "https://divyatariwala.github.io"
]

# Allow local frontend and ngrok frontend
CORS_ALLOWED_ORIGINS = [
    "https://theratrack-1-k5n9.onrender.com"
    "http://localhost:3000",       # Local React frontend
    "http://127.0.0.1:3000",
    "https://divyatariwala.github.io"
]

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
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD")
DEFAULT_FROM_EMAIL = "TheraTrack <noreply.theratrack@gmail.com>"

APP_URL = "https://theratrack-1-k5n9.onrender.com"
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
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# ----------------------
# DEFAULT AUTO FIELD
# ----------------------
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
