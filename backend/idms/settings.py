import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

# Fix SSL certificate verification on Windows — patches certifi to use the
# Windows trusted CA store so requests to Google/external APIs work correctly.
try:
    import certifi_win32  # noqa: F401
except ImportError:
    pass

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get('SECRET_KEY', 'fallback-secret-key-change-in-production')
DEBUG      = os.environ.get('DEBUG', 'True') == 'True'
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '127.0.0.1,localhost').split(',')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites',          # required by allauth
    # Third-party
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'axes',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',
    'django_celery_results',
    'django_celery_beat',
    # Local
    'core',
    'api',
    'auth_app',
]

SITE_ID = 1

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'allauth.account.middleware.AccountMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'axes.middleware.AxesMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'middleware.security_middleware.SecurityHeadersMiddleware',
    'middleware.security_middleware.FileAccessLogMiddleware',
]

ROOT_URLCONF = 'idms.urls'
TEMPLATES = [{
    'BACKEND': 'django.template.backends.django.DjangoTemplates',
    'DIRS': [BASE_DIR / 'templates'],
    'APP_DIRS': True,
    'OPTIONS': {'context_processors': [
        'django.template.context_processors.debug',
        'django.template.context_processors.request',
        'django.contrib.auth.context_processors.auth',
        'django.contrib.messages.context_processors.messages',
    ]},
}]
WSGI_APPLICATION = 'idms.wsgi.application'

# ── Database ──────────────────────────────────────────────────────────────────
_db_engine = os.environ.get('DB_ENGINE', 'django.db.backends.mysql')
if _db_engine == 'django.db.backends.mysql':
    DATABASES = {'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.environ.get('DB_NAME', 'idms'),
        'USER': os.environ.get('DB_USER', 'root'),
        'PASSWORD': os.environ.get('DB_PASSWORD', ''),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '3306'),
        'OPTIONS': {'charset': 'utf8mb4', 'init_command': "SET sql_mode='STRICT_TRANS_TABLES'"},
    }}
else:
    DATABASES = {'default': {'ENGINE': 'django.db.backends.sqlite3', 'NAME': BASE_DIR / 'db.sqlite3'}}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'fr-fr'
TIME_ZONE     = 'Africa/Tunis'
USE_I18N = True
USE_TZ   = True

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ── Static & Media ────────────────────────────────────────────────────────────
STATIC_URL  = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

USE_S3 = os.environ.get('USE_S3', 'False') == 'True'

if USE_S3:
    AWS_ACCESS_KEY_ID       = os.environ.get('AWS_ACCESS_KEY_ID', '')
    AWS_SECRET_ACCESS_KEY   = os.environ.get('AWS_SECRET_ACCESS_KEY', '')
    AWS_STORAGE_BUCKET_NAME = os.environ.get('AWS_STORAGE_BUCKET_NAME', 'idms-bucket')
    AWS_S3_REGION_NAME      = os.environ.get('AWS_S3_REGION_NAME', 'us-east-1')
    AWS_S3_ENDPOINT_URL     = os.environ.get('AWS_S3_ENDPOINT_URL', '') or None  # None = default AWS
    AWS_DEFAULT_ACL         = 'private'
    AWS_S3_FILE_OVERWRITE   = False
    AWS_QUERYSTRING_AUTH    = True

    STORAGES = {
        'default':     {'BACKEND': 'storages.backends.s3boto3.S3Boto3Storage'},
        'staticfiles': {'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage'},
    }
    MEDIA_URL = f"https://{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com/"
else:
    MEDIA_URL  = '/media/'
    MEDIA_ROOT = BASE_DIR / os.environ.get('MEDIA_ROOT', 'media')

# ── CORS ──────────────────────────────────────────────────────────────────────
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
CORS_ALLOWED_ORIGINS  = [FRONTEND_URL, 'http://localhost:3000', 'http://127.0.0.1:5173']
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'accept', 'accept-encoding', 'authorization', 'content-type',
    'dnt', 'origin', 'user-agent', 'x-csrftoken', 'x-requested-with',
]

# ── DRF ───────────────────────────────────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': ('rest_framework_simplejwt.authentication.JWTAuthentication',),
    'DEFAULT_PERMISSION_CLASSES':     ('rest_framework.permissions.IsAuthenticated',),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_RENDERER_CLASSES': ('rest_framework.renderers.JSONRenderer',),
    'EXCEPTION_HANDLER': 'api.views.custom_exception_handler',
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME':  timedelta(minutes=int(os.environ.get('JWT_ACCESS_TOKEN_LIFETIME', 60))),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=int(os.environ.get('JWT_REFRESH_TOKEN_LIFETIME', 7))),
    'ROTATE_REFRESH_TOKENS':  True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'UPDATE_LAST_LOGIN': True,
}

# ── django-allauth ────────────────────────────────────────────────────────────
AUTHENTICATION_BACKENDS = [
    'axes.backends.AxesStandaloneBackend',
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend',
]

ACCOUNT_SIGNUP_FIELDS           = ['email*', 'password1*', 'password2*']
ACCOUNT_LOGIN_METHODS           = ['email']
ACCOUNT_EMAIL_VERIFICATION      = 'none'
ACCOUNT_USERNAME_REQUIRED       = False
SOCIALACCOUNT_LOGIN_ON_GET      = True   # allow GET to /accounts/google/login/
SOCIALACCOUNT_AUTO_SIGNUP                    = True
SOCIALACCOUNT_EMAIL_AUTHENTICATION           = True
SOCIALACCOUNT_EMAIL_AUTHENTICATION_AUTO_CONNECT = True
SOCIALACCOUNT_ADAPTER                        = 'auth_app.adapters.CustomSocialAccountAdapter'
ACCOUNT_DEFAULT_HTTP_PROTOCOL   = 'http'
LOGIN_REDIRECT_URL              = '/auth/jwt-redirect/'  # after allauth success → generate JWT

SOCIALACCOUNT_PROVIDERS = {
    'google': {
        # No 'APP' key here — credentials come from the SocialApp DB record.
        # Having both APP in settings AND a DB SocialApp causes MultipleObjectsReturned.
        'SCOPE': ['profile', 'email'],
        'AUTH_PARAMS': {'access_type': 'online'},
    }
}

# ── Google OAuth (custom auth_app flow) ───────────────────────────────────────
GOOGLE_CLIENT_ID     = os.environ.get('GOOGLE_CLIENT_ID', '')
GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET', '')

# Comma-separated list of emails that are treated as admin accounts on OAuth sign-in
ADMIN_EMAILS = [
    e.strip()
    for e in os.environ.get('ADMIN_EMAILS', '').split(',')
    if e.strip()
]

# ── AI — Google Gemini ────────────────────────────────────────────────────────
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
GEMINI_MODEL   = 'gemini-flash-lite-latest'

# ── Celery ────────────────────────────────────────────────────────────────────
REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')

CELERY_BROKER_URL         = REDIS_URL
CELERY_RESULT_BACKEND     = 'django-db'
CELERY_CACHE_BACKEND      = 'default'
CELERY_ACCEPT_CONTENT     = ['json']
CELERY_TASK_SERIALIZER    = 'json'
CELERY_RESULT_SERIALIZER  = 'json'
CELERY_TIMEZONE           = TIME_ZONE
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT    = 300  # 5 min hard limit per task

def _make_cache():
    import socket
    try:
        from urllib.parse import urlparse
        _u = urlparse(REDIS_URL)
        s = socket.create_connection((_u.hostname, _u.port or 6379), timeout=1)
        s.close()
        return {'default': {'BACKEND': 'django.core.cache.backends.redis.RedisCache', 'LOCATION': REDIS_URL}}
    except OSError:
        return {'default': {'BACKEND': 'django.core.cache.backends.db.DatabaseCache', 'LOCATION': 'django_cache'}}

CACHES = _make_cache()

# ── File upload limits ────────────────────────────────────────────────────────
MAX_FILE_SIZE_MB = int(os.environ.get('MAX_FILE_SIZE_MB', 50))
MAX_ZIP_SIZE_MB  = int(os.environ.get('MAX_ZIP_SIZE_MB', 200))
DATA_UPLOAD_MAX_MEMORY_SIZE = MAX_ZIP_SIZE_MB * 1024 * 1024
FILE_UPLOAD_MAX_MEMORY_SIZE = MAX_ZIP_SIZE_MB * 1024 * 1024

# ── Logging ───────────────────────────────────────────────────────────────────
LOGGING = {
    'version': 1, 'disable_existing_loggers': False,
    'formatters': {'verbose': {'format': '[{levelname}] {asctime} {module} — {message}', 'style': '{'}},
    'handlers': {'console': {'class': 'logging.StreamHandler', 'formatter': 'verbose'}},
    'root': {'handlers': ['console'], 'level': 'INFO'},
    'loggers': {'idms.security': {'handlers': ['console'], 'level': 'INFO', 'propagate': False}},
}

# ── django-axes ───────────────────────────────────────────────────────────────
AXES_FAILURE_LIMIT    = 5
AXES_COOLOFF_TIME     = 1
AXES_RESET_ON_SUCCESS = True
AXES_HANDLER          = 'axes.handlers.database.AxesDatabaseHandler'
AXES_ENABLED          = True

# ── Security headers ──────────────────────────────────────────────────────────
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
