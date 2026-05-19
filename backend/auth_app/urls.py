from django.urls import path
from . import views

urlpatterns = [
    # allauth → JWT bridge (called after Google OAuth success)
    path('jwt-redirect/', views.JWTRedirectView.as_view(), name='jwt-redirect'),
    # Legacy custom OAuth endpoints (kept for compatibility)
    path('google/', views.google_login, name='google-login'),
    path('google/token/', views.google_token_login, name='google-token-login'),
]
