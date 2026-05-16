from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from auth_app.views import google_oauth_callback

urlpatterns = [
    path('admin/',    admin.site.urls),
    path('api/',      include('api.urls')),
    path('auth/',     include('auth_app.urls')),
    # Stateless callback — registered BEFORE allauth so it intercepts
    # /accounts/google/login/callback/ without session-state validation
    path('accounts/google/login/callback/', google_oauth_callback),
    path('accounts/', include('allauth.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
